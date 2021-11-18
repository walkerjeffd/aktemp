import Vue from 'vue'
import axios from 'axios'

// import { getToken } from '@/lib/auth'

const externalAxios = axios.create()

const publicAxios = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/public`
})

const restrictedAxios = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/restricted`
})
restrictedAxios.interceptors.request.use(async function (config) {
  // config.headers.Authorization = await getToken()
  return config
}, null)

const adminAxios = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL}/admin`
})
adminAxios.interceptors.request.use(async function (config) {
  // config.headers.Authorization = await getToken()
  return config
}, null)

Vue.prototype.$http = {
  public: publicAxios,
  restricted: restrictedAxios,
  admin: adminAxios,
  external: externalAxios
}
