import Vue from 'vue'
import axios from 'axios'

import { getToken } from '@/lib/auth'

export const externalApi = axios.create()

export const publicApi = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/public`
})

export const restrictedApi = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/restricted`
})
restrictedApi.interceptors.request.use(async function (config) {
  config.headers.Authorization = await getToken()
  return config
}, null)

export const adminApi = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/admin`
})
adminApi.interceptors.request.use(async function (config) {
  config.headers.Authorization = await getToken()
  return config
}, null)

Vue.prototype.$http = {
  public: publicApi,
  restricted: restrictedApi,
  admin: adminApi,
  external: externalApi
}
