import Vue from 'vue'
import HighchartsVue from 'highcharts-vue'
import Highcharts from 'highcharts'
import more from 'highcharts/highcharts-more'
// import boost from 'highcharts/modules/boost'

more(Highcharts)
// boost(Highcharts)

Highcharts.setOptions({
  lang: {
    thousandsSep: ','
  },
  colors: ['#004895']
})

Vue.use(HighchartsVue)
