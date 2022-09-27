import dayjs from 'dayjs'
import * as d3 from 'd3'
import Vue from 'vue'
import { formatBooleanOption, formatTimestamp } from '@/lib/utils'

Vue.filter('d3Format', (v, format) => d3.format(format)(v))

Vue.filter('timestampFromNow', (v) => dayjs(v).fromNow())
Vue.filter('formatTimestamp', (v, format, tz) => formatTimestamp(v, format, tz))

Vue.filter('formatBooleanOption', formatBooleanOption)

Vue.filter('seriesDepth', (v) => v.depth_category || (isFinite(v.depth_m) && v.depth_m !== null ? `${v.depth_m} m` : '') || '')
