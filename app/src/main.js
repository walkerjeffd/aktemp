import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'

import vuetify from './plugins/vuetify'

import './filters'

import './plugins/amplify'
import './plugins/axios'
import './plugins/luxon'
import './plugins/error-message'
import './plugins/file-saver'
import './plugins/highcharts'
import './plugins/handsontable'
import './plugins/leaflet'
import './plugins/pretty-bytes'

import '@/assets/styles.css'

import Alert from '@/components/Alert'
import Checkbox from '@/components/Checkbox'
import ConfirmDialog from '@/components/ConfirmDialog'
import DownloadButton from '@/components/DownloadButton'
import Loading from '@/components/Loading'
import RefreshButton from '@/components/RefreshButton'
import StatusChip from '@/components/StatusChip'
Vue.component('Alert', Alert)
Vue.component('Checkbox', Checkbox)
Vue.component('ConfirmDialog', ConfirmDialog)
Vue.component('DownloadButton', DownloadButton)
Vue.component('Loading', Loading)
Vue.component('RefreshButton', RefreshButton)
Vue.component('StatusChip', StatusChip)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
