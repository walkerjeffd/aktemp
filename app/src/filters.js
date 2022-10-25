import * as d3 from 'd3'
import Vue from 'vue'

const { formatTimestamp } = require('aktemp-utils/time')

Vue.filter('d3Format', (v, format) => d3.format(format)(v))

Vue.filter('timestamp', formatTimestamp)

// Vue.filter('uppercase', (v) => {
//   console.log(v)
//   if (v === null || v === undefined) return ''
//   return v.toString().toUpperCase()
// })

Vue.filter('numberLocaleString', (v) => typeof v === 'number' ? v.toLocaleString() : '')
