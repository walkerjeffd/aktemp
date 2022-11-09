import * as d3 from 'd3'
import Vue from 'vue'

const { formatTimestamp } = require('aktemp-utils/time')
const { sensorAccuracyOptions } = require('aktemp-utils/constants')

Vue.filter('d3Format', (v, format) => d3.format(format)(v))

Vue.filter('timestamp', formatTimestamp)

Vue.filter('accuracy', (v) => {
  if (!v) return ''
  const item = sensorAccuracyOptions.find(d => d.value === v)
  return item ? item.label : 'UNKNOWN'
})

Vue.filter('numberLocaleString', (v) => typeof v === 'number' ? v.toLocaleString() : '')
