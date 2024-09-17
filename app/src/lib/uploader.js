import { restrictedApi, externalApi } from '@/plugins/axios'

async function createFile (file, config, providerId) {
  if (!file) throw new Error('File not found')
  const filename = file.name
  const response = await restrictedApi.post(`/providers/${providerId}/files`, {
    filename,
    type: config.file_type,
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

export async function uploadFileToS3 (file, dbFile) {
  const formData = new FormData()
  Object.keys(dbFile.presignedUrl.fields).forEach((key) => {
    formData.append(key, dbFile.presignedUrl.fields[key])
  })
  formData.append('file', file)

  return await externalApi.post(dbFile.presignedUrl.url, formData)
}

export default async function (file, config, providerId) {
  const dbFile = await createFile(file, config, providerId)

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
