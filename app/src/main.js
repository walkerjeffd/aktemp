import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'

import vuetify from './plugins/vuetify'

import './plugins/amplify'
import './plugins/axios'
import './plugins/dayjs'
import './plugins/highcharts'
import './plugins/leaflet'
import './plugins/pretty-bytes'

import '@/assets/styles.css'

import AlertError from '@/components/AlertError'
Vue.component('AlertError', AlertError)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
