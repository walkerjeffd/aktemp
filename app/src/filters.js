import dayjs from 'dayjs'
import * as d3 from 'd3'
import Vue from 'vue'
import { formatBooleanOption } from '@/lib/utils'

Vue.filter('d3Format', (v, format) => d3.format(format)(v))
Vue.filter('timestampFromNow', (v) => dayjs(v).fromNow())
Vue.filter('timestampFormat', (v, format) => dayjs(v).format(format))
Vue.filter('timestampTimezoneFormat', (v, tz, format) => dayjs(v).tz(tz).format(format))
Vue.filter('formatBooleanOption', formatBooleanOption)
Vue.filter('seriesDepth', (v) => v.depth_category || (isFinite(v.depth_m) && v.depth_m !== null ? `${v.depth_m} m` : '') || 'UNKNOWN')
