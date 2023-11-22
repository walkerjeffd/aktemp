const debug = require('../debug')
const path = require('path')
const { createReadStream, readFileSync, existsSync, copyFileSync, mkdirSync } = require('fs')

const { File } = require('aktemp-db/models')
const db = require('aktemp-db')
const { parseCsv, parseSeriesFile, parseProfilesFile } = require('aktemp-utils/parsers')
const { stripBom } = require('aktemp-utils/utils')
const { validateFileConfig } = require('aktemp-utils/validators')

const { s3 } = require('../aws')
const { readLocalCsvFile } = require('./utils')
const { findProviderByCode } = require('./providers')
const { findStations } = require('./stations')

async function readFileFromS3 (file, config) {
  const { Bucket, Key } = file.s3
  debug(`readFileFromS3(): ${Bucket}/${Key}`)
  const object = await s3.getObject({ Bucket, Key }).promise()
  const csv = stripBom(object.Body.toString())
  debug('readFileFromS3(): parsing')
  const parsed = parseCsv(csv, config.file_skip)
  debug('readFileFromS3(): done')
  return { data: parsed.data, fields: parsed.meta.fields }
}

async function readFileFromLocal (file, config) {
  const filepath = file.url
  debug(`readFileFromLocal(): ${filepath}`)
  const csv = stripBom(readFileSync(filepath).toString())
  debug('readFileFromLocal(): parsing')
  const parsed = parseCsv(csv, config.skipLines)
  debug('readFileFromLocal(): done')
  return { data: parsed.data, fields: parsed.meta.fields }
}

module.exports.findFiles = async function (providerCode) {
  const provider = await findProviderByCode(providerCode)
  let query = File.query()
  if (providerCode) {
    query = provider.$relatedQuery('files')
  }
  return await query
    .modify('providerCode')
    .orderBy('id')
}

module.exports.deleteFile = async function (id) {
  debug(`deletingFile: id=${id}`)
  const file = await File.query()
    .findById(id)
    .throwIfNotFound({
      message: `file (id=${id}) not found`,
      type: 'NotFoundError'
    })

  if (file.s3) {
    const { Key, Bucket } = file.s3
    debug(`deleting s3 file: Bucket=${Bucket}, Key=${Key})`)
    await s3.deleteObject({ Key, Bucket }).promise()
  }

  const row = await file.$query()
    .delete()
    .returning('*')

  return row
}

exports.processFile = async function (id, { dryRun }) {
  debug(`processFile(): id=${id}, dryRun=${dryRun}`)

  let file = await File.query()
    .findById(id)
    .throwIfNotFound({
      message: `file (id=${id}) not found`,
      type: 'NotFoundError'
    })
  debug(`processFile(): file.type=${file.type}`)
  const relationTable = file.type.toLowerCase()

  if (!dryRun) {
    debug(`processFile(): deleting existing ${relationTable}`)
    await file.$relatedQuery(relationTable).delete()

    debug('processFile(): set file.status=\'PROCESSING\'')
    await file.$query().patch({
      status: 'PROCESSING',
      error: null
    })
  }
  let data, fields
  if (file.s3) {
    debug(`processFile(): read file from s3 (bucket=${file.s3.Bucket} key=${file.s3.Key})`)
    ;({ data, fields } = await readFileFromS3(file, file.config))
  } else if (file.url) {
    // assume url is path to local file
    debug(`processFile(): read file from local filesystem (path=${file.url})`)
    ;({ data, fields } = await readFileFromLocal(file, file.config))
  } else {
    throw new Error(`file has no 'url' or 's3' attributes (id=${id})`)
  }

  if (data.length > 0) {
    debug('processFile(): first row ->')
    debug(data[0])
  }

  debug('processFile(): add row numbers')
  data.forEach((d, i) => { d.$row = i + 1 })

  debug('processFile(): get provider')
  const provider = await file.$relatedQuery('provider')

  debug('processFile(): get stations')
  const stations = await provider.$relatedQuery('stations')

  debug('processFile(): validate config ->')
  const config = await validateFileConfig(file.config, fields, stations)
  debug(config)

  if (config.file_type === 'SERIES') {
    debug('processFile(): parsing series file')
    const parsed = parseSeriesFile(data, config, stations)
    const series = parsed.map(({ station_code, ...d }) => d) // eslint-disable-line
    if (!dryRun) {
      debug(`processFile(): saving series (n=${series.length})`)
      let i = 0
      for (const s of series) {
        debug(`processFile(): inserting series (${i} of ${series.length})`)
        await file.$relatedQuery('series').insertGraph(s)
        i++
      }

      debug('processFile(): inserting daily values into series_daily')
      await db.raw(`
        insert into series_daily (series_id, date, n_values, min_temp_c, mean_temp_c, max_temp_c)
        select
          sv.series_id as series_id,
          to_char((sv.datetime at time zone st.timezone), 'YYYY-MM-DD')::date as date,
          count(temp_c) as n_values,
          min(temp_c) as min_temp_c,
          avg(temp_c) as mean_temp_c,
          max(temp_c) as max_temp_c
        from series_values sv
        left join series s on sv.series_id=s.id
        left join stations st on s.station_id=st.id
        where s.file_id=?
        group by series_id, date
        order by series_id, date;
      `, [file.id])
    } else {
      file.series = series
      file.status = 'DONE'
      return file
    }
  } else if (config.file_type === 'PROFILES') {
    debug('processFile(): parsing profiles file')
    const parsed = parseProfilesFile(data, config, stations)
    const profiles = parsed.map(({ station_code, ...d }) => d) // eslint-disable-line
    if (!dryRun) {
      debug(`processFile(): saving profiles (n=${profiles.length})`)
      await file.$relatedQuery('profiles').insertGraph(profiles)
    } else {
      file.profiles = profiles
      file.status = 'DONE'
      return file
    }
  }

  if (!dryRun) {
    debug('set status: DONE')
    file = await file.$query().patch({
      status: 'DONE'
    }).returning('*')
  }

  debug('done')

  return await File.query()
    .findById(file.id)
    .modify('providerCode')
    .withGraphFetched('[series, profiles]')
}

const uploadFile = exports.uploadFile = async function (file, filepath, provider, options) {
  debug(`uploadFile(): filepath=${filepath}`)

  // check data file exists
  if (!existsSync(filepath)) {
    throw new Error(`file not found (${filepath})`)
  }

  // create file instance
  debug('uploadFile(): insert file')
  const dbFile = await provider.$relatedQuery('files').insert({
    ...file,
    status: 'CREATED'
  }).returning('*')

  // upload to s3
  const key = `files/${dbFile.uuid}/${dbFile.filename}`
  if (process.env.STORAGE_BUCKET) {
    const stream = createReadStream(filepath)
    const bucket = process.env.STORAGE_BUCKET
    debug(`uploadFile(): upload to s3 (bucket=${bucket}, key=${key})`)
    const s3Response = await s3.upload({
      Bucket: bucket,
      Key: key,
      Body: stream
    }).promise()
    debug('uploadFile(): set file.status=\'UPLOADED\'')
    await dbFile.$query().patch({
      s3: s3Response,
      url: s3Response.Location,
      status: 'UPLOADED'
    })
  } else if (process.env.STORAGE_PATH) {
    const localPath = process.env.STORAGE_PATH
    const dest = path.join(localPath, key)
    if (!existsSync(path.dirname(dest))) {
      debug(`uploadFile(): creating directory (${path.dirname(dest)})`)
      mkdirSync(path.dirname(dest), { recursive: true })
    }
    debug(`uploadFile(): saving to local path (path=${dest})`)
    copyFileSync(filepath, dest)
    debug('uploadFile(): set file.status=\'UPLOADED\'')
    await dbFile.$query().patch({
      url: dest,
      status: 'UPLOADED'
    })
  } else {
    throw new Error('STORAGE_BUCKET or STORAGE_PATH must be set')
  }

  return dbFile
}

const createFile = exports.createFile = async function (filepath, { filename, ...row }, provider) {
  const stations = await findStations(provider.code)
  const { data, fields } = await readLocalCsvFile(filepath, row.file_skip)
  if (data.length === 0) {
    throw new Error(`file is empty ('${filepath}')`)
  }
  const config = await validateFileConfig(row, fields, stations)
  return {
    filename: path.basename(filepath),
    type: config.file_type,
    config
  }
}

exports.importFiles = async function (providerCode, filepath, { directory, ...options }) {
  debug('importFiles()')

  // fetch provider
  debug(`fetching provider: code=${providerCode}`)
  const provider = await findProviderByCode(providerCode)

  // read manifest file
  debug('loading manifest:', filepath)
  const { data: rows } = await readLocalCsvFile(filepath)
  debug(`processing files (n=${rows.length})`)

  // process
  const files = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const filename = row.filename
    debug(`preparing: ${filename} (${i + 1}/${rows.length})`)
    const filepath = path.join(directory, filename)
    try {
      const file = await createFile(filepath, row, provider)
      files.push(file)
    } catch (err) {
      console.error(`Failed to create file (row=${i})`)
      throw err
    }
  }

  const results = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    debug(`uploading: ${file.filename} (${i + 1}/${files.length})`)

    const filepath = path.join(directory, file.filename)
    try {
      const result = await uploadFile(file, filepath, provider, options)
      results.push(result)
    } catch (err) {
      file.error = err.toString()
      results.push(file)
    }
  }

  return results
}
