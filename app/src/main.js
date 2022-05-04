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

import Alert from '@/components/Alert'
Vue.component('Alert', Alert)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
