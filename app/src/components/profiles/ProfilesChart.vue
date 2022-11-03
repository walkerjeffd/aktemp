<template>
  <div style="width:100%">
    <Loading v-if="loading" style="height:500px"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Profile Data" class="mb-0">{{ error }}</Alert>
    <div v-show="!loading && !error">
      <highcharts :options="settings" ref="chart"></highcharts>
    </div>
  </div>
</template>

<script>
import { ascending } from 'd3'

export default {
  name: 'ProfileChart',
  props: ['profiles'],
  data () {
    return {
      loading: false,
      error: null,
      settings: {
        chart: {
          height: 500,
          marginLeft: 50,
          type: 'scatter',
          events: {
            load: async (e) => {
              this.chart = e.target
            }
            // redraw () {
            //   console.log('redraw')
            // },
            // render () {
            //   console.log('render')
            // }
          }
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          pointFormat: 'Depth: <b>{point.y}</b> m<br />Temperature: <b>{point.x} °C</b>',
          valueDecimals: 1
        },
        xAxis: {
          title: {
            text: 'Temperature (degC)',
            align: 'low',
            margin: 14
          },
          opposite: true,
          startOnTick: true
        },
        yAxis: {
          title: {
            text: 'Depth (m)'
          },
          reversed: true,
          lineWidth: 1,
          tickWidth: 1,
          startOnTick: true,
          endOnTick: false
        },
        series: []
      }
    }
  },
  mounted () {
    this.render()
  },
  watch: {
    profiles () {
      this.render()
    }
  },
  methods: {
    render () {
      if (!this.chart) return

      this.chart.series
        .forEach(d => this.chart.get(d.options.id).remove(false))

      const series = this.profiles
        .filter(d => d.values && d.values.length > 0)
        .map(p => {
          const data = p.values
            .sort((a, b) => ascending(a.depth_m, b.depth_m))
            .map(v => [v.value, v.depth_m])
          return {
            id: p.id,
            zIndex: 1,
            lineWidth: 1,
            marker: {
              symbol: 'circle',
              radius: 3
            },
            data
          }
        })
      series.forEach(d => this.chart.addSeries(d, false))
      this.chart.redraw()
    }
  }
}
</script>

<style>

</style>
