import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'

import vuetify from './plugins/vuetify'

import './filters'

import './plugins/amplify'
import './plugins/axios'
import './plugins/dayjs'
import './plugins/highcharts'
import './plugins/handsontable'
import './plugins/leaflet'
import './plugins/pretty-bytes'

import '@/assets/styles.css'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import Loading from '@/components/Loading'
import RefreshButton from '@/components/RefreshButton'
import StatusChip from '@/components/StatusChip'
Vue.component('Alert', Alert)
Vue.component('Loading', Loading)
Vue.component('RefreshButton', RefreshButton)
Vue.component('ConfirmDialog', ConfirmDialog)
Vue.component('StatusChip', StatusChip)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
