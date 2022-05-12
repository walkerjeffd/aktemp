import Vue from 'vue'
import { HotTable, HotColumn } from '@handsontable/vue'
import { registerAllModules } from 'handsontable/registry'

import 'handsontable/dist/handsontable.full.css'

registerAllModules()

Vue.component('HotTable', HotTable)
Vue.component('HotColumn', HotColumn)
