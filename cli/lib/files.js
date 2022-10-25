const debug = require('../debug')
const path = require('path')
const { createReadStream, existsSync } = require('fs')

const { File } = require('aktemp-db/models')

const { parseCsv, parseSeriesFile, parseProfilesFile } = require('aktemp-utils/parsers')
const { stripBom } = require('aktemp-utils/utils')
const { validateFileConfig } = require('aktemp-utils/validators')

const { s3 } = require('../aws')
const { readLocalCsvFile } = require('./utils')
const { findOrganizationByCode } = require('./organizations')
const { findStations } = require('./stations')

async function readFileFromS3 (file, config) {
  const { Bucket, Key } = file.s3
  const object = await s3.getObject({ Bucket, Key }).promise()
  const csv = stripBom(object.Body.toString())
  // const csv = object.Body.toString()
  try {
    const parsed = parseCsv(csv, config.file_skip)
    return { data: parsed.data, fields: parsed.meta.fields }
  } catch (err) {
    console.log(err)
    throw new Error(`failed to parse CSV file from s3 (bucket='${Bucket}', key='${Key}', filename='${file.filename}'), error: ${err.toString()}`)
  }
}

module.exports.findFiles = async function (organizationCode) {
  const organization = await findOrganizationByCode(organizationCode)
  let query = File.query()
  if (organizationCode) {
    query = organization.$relatedQuery('files')
  }
  return await query
    .modify('organizationCode')
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

  debug(`processFile(): deleting existing ${relationTable}`)
  await file.$relatedQuery(relationTable).delete()

  if (!dryRun) {
    debug('processFile(): set file.status=\'PROCESSING\'')
    await file.$query().patch({
      status: 'PROCESSING',
      error: null
    })
  }

  debug(`processFile(): read file from s3 (bucket=${file.s3.Bucket} key=${file.s3.Key})`)
  const { data, fields } = await readFileFromS3(file, file.config)

  debug('processFile(): add row numbers')
  data.forEach((d, i) => { d.$row = i + 1 })

  debug('processFile(): get organization')
  const organization = await file.$relatedQuery('organization')

  debug('processFile(): get stations')
  const stations = await organization.$relatedQuery('stations')

  debug('processFile(): validate config ->')
  const config = await validateFileConfig(file.config, fields, stations)
  debug(file.config)

  if (config.file_type === 'SERIES') {
    debug('processFile(): parsing series file')
    const parsed = parseSeriesFile(data, config, stations)
    const series = parsed.map(({ station_code, ...d }) => d) // eslint-disable-line
    if (!dryRun) {
      debug(`processFile(): saving series (n=${series.length})`)
      await file.$relatedQuery('series').insertGraph(series)
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

  // // group by station
  // debug('group rows by station')
  // let stationData = []
  // if (config.station_code) {
  //   const station = stations.find(d => d.code === config.station_code)
  //   if (!station) {
  //     throw new Error(`station not found (code=${config.station_code})`)
  //   }
  //   stationData = [{
  //     stationCode: station.code,
  //     values: data
  //   }]
  // } else if (config.station_column) {
  //   const stationColumn = config.station_column
  //   stationData = Array.from(
  //     d3.group(data, d => d[stationColumn]),
  //     ([key, value]) => ({ stationCode: key, values: value })
  //   )
  // }

  // debug(`fetching stations (n=${stationData.length})`)
  // for (let i = 0; i < stationData.length; i++) {
  //   const code = stationData[i].stationCode
  //   debug(`fetching station: code='${code}'`)
  //   const station = stations.find(d => d.code === code)
  //   if (!station) {
  //     throw new Error(`station not found (code=${code})`)
  //   }
  //   stationData[i].station = station
  // }

  // stationData.forEach(d => {
  //   debug(`parsing rows: code='${d.station.code}' n=${d.values.length}`)
  //   const parsedRows = parseRows(d.values, d.station.timezone, config)
  //   d.values = parsedRows.map(d => ({
  //     datetime: d.datetime,
  //     value: d.value
  //   }))
  //   if (d.values.length > 0) {
  //     debug('first row')
  //     debug(d.values[0])
  //   }
  //   d.flags = extractFlags(parsedRows)
  //   debug(`flags: n=${d.flags.length}`)
  // })

  // const seriesDepth = {
  //   depth_category: config.depth_category,
  //   depth_m: convertDepthUnits(config.depth_value, config.depth_units)
  // }

  // const meta = {
  //   accuracy: config.accuracy,
  //   reviewed: config.reviewed
  // }

  // if (config.file_type === 'SERIES') {
  //   meta.interval = config.interval
  //   meta.sop_bath = config.sop_bath

  //   // save each series
  //   for (let i = 0; i < stationData.length; i++) {
  //     debug(`preparing series (${i + 1}/${stationData.length})`)
  //     const datetimes = stationData[i].values.map(d => d.datetime)
  //     const datetimeExtent = d3.extent(datetimes)
  //     const frequency = await medianFrequency(datetimes)

  //     const series = {
  //       file_id: file.id,
  //       flags: stationData[i].flags,
  //       values: stationData[i].values,
  //       start_datetime: datetimeExtent[0],
  //       end_datetime: datetimeExtent[1],
  //       frequency,
  //       ...seriesDepth,
  //       ...meta
  //     }

  //     if (dryRun) {
  //       stationData[i].series = series
  //     } else {
  //       debug(`saving series (${i + 1}/${stationData.length})`)
  //       stationData[i].series = await stationData[i].station
  //         .$relatedQuery('series')
  //         .insertGraph(series)
  //     }
  //   }
  // } else if (config.type === 'PROFILES') {
  //   for (let i = 0; i < stationData.length; i++) {
  //     debug(`creating profile (${i + 1}/${stationData.length})`)
  //     const profiles = Array.from(
  //       d3.group(stationData[i].values, d => d.datetime.substr(0, 10)),
  //       ([key, value]) => ({ date: key, values: value, file_id: file.id, ...meta })
  //     )
  //     if (dryRun) {
  //       stationData[i].profiles = profiles
  //     } else {
  //       debug(`saving profile (${i + 1}/${stationData.length})`)
  //       stationData[i].profiles = await stationData[i].station
  //         .$relatedQuery('profiles')
  //         .insertGraph(profiles)
  //     }
  //   }
  // }

  if (!dryRun) {
    debug('set status: DONE')
    file = await file.$query().patch({
      status: 'DONE'
    }).returning('*')
  }

  debug('done')

  return await File.query()
    .findById(file.id)
    .withGraphFetched('[series, profiles]')
}

const uploadFile = exports.uploadFile = async function (file, filepath, organization, options) {
  debug(`uploadFile(): filepath=${filepath}`)

  // check data file exists
  if (!existsSync(filepath)) {
    throw new Error(`file not found (${filepath})`)
  }

  // create file instance
  debug('uploadFile(): insert file')
  const dbFile = await organization.$relatedQuery('files').insert({
    ...file,
    status: 'CREATED'
  }).returning('*')

  // upload to s3
  const stream = createReadStream(filepath)
  const bucket = process.env.STORAGE_BUCKET
  const key = `files/${dbFile.uuid}/${dbFile.filename}`
  debug(`uploadFile(): upload to s3 (bucket=${bucket}, key=${key})`)
  const s3Response = await s3.upload({
    Bucket: bucket,
    Key: key,
    Body: stream
  }).promise()

  // update s3 and status
  debug('uploadFile(): set file.status=\'UPLOADED\'')
  await dbFile.$query().patch({
    s3: s3Response,
    url: s3Response.Location,
    status: 'UPLOADED'
  })

  return dbFile
}

const createFile = exports.createFile = async function (filepath, { filename, ...row }, organization) {
  const stations = await findStations(organization.code)
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

exports.importFiles = async function (organizationCode, filepath, { directory, ...options }) {
  debug('importFiles()')

  // fetch organization
  debug(`fetching organization: code=${organizationCode}`)
  const organization = await findOrganizationByCode(organizationCode)

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
      const file = await createFile(filepath, row, organization)
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
      const result = await uploadFile(file, filepath, organization, options)
      results.push(result)
    } catch (err) {
      file.error = err.toString()
      results.push(file)
    }
  }

  return results
}
