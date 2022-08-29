import { restrictedApi, externalApi } from '@/plugins/axios'

async function createFile (file, config, organizationId) {
  if (!file) throw new Error('File not found')
  const filename = file.name
  const response = await restrictedApi.post(`/organizations/${organizationId}/files`, {
    filename,
    type: config.type,
    config
  })

  return response.data
}

async function updateFile (file, payload) {
  return await restrictedApi.put(
    `/files/${file.id}`,
    payload
  )
}

async function processFile (file) {
  return await restrictedApi.post(
    `/files/${file.id}/process`,
    null
  )
}

async function deleteFile (file) {
  return await restrictedApi.delete(`/files/${file.id}`)
}

async function uploadFileToS3 (file, dbFile) {
  const formData = new FormData()
  Object.keys(dbFile.presignedUrl.fields).forEach((key) => {
    formData.append(key, dbFile.presignedUrl.fields[key])
  })
  formData.append('file', file)

  const response = await externalApi.post(dbFile.presignedUrl.url, formData)

  const payload = {
    url: `https://${dbFile.s3.Bucket}.s3.amazonaws.com/${dbFile.s3.Key}`,
    s3: response.data.s3
  }

  return await updateFile(dbFile, payload)
}

export default async function (file, config, organizationId) {
  const dbFile = await createFile(file, config, organizationId)

  try {
    await updateFile(dbFile, { status: 'UPLOADING' })
    await uploadFileToS3(file, dbFile)
    await processFile(dbFile)
  } catch (err) {
    await deleteFile(dbFile)
    throw err
  }
  return dbFile
}
