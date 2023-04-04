<template>
  <div style="width:100%">
    <Loading v-if="loading" style="height:500px"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Profile Data" class="mb-0">
      <div v-html="error"></div>
    </Alert>
    <div v-show="!loading && !error">
      <highcharts :options="settings" ref="chart"></highcharts>
      <div class="text--secondary caption ml-2">
        <v-icon x-small>mdi-information</v-icon> Click+drag to zoom in, hold shift to pan.
      </div>
    </div>
  </div>
</template>

<script>
import { ascending } from 'd3'
const { formatTimestamp } = require('aktemp-utils/time')
export default {
  name: 'ProfileChart',
  props: ['profiles'],
  data () {
    return {
      loading: false,
      error: null,
      settings: {
        chart: {
          panKey: 'shift',
          panning: {
            enabled: true,
            type: 'xy'
          },
          zoomType: 'xy',
          height: 500,
          marginLeft: 50,
          type: 'scatter',
          animation: false,
          events: {
            load: async (e) => {
              this.chart = e.target
              window.chart = this.chart
            }
          },
          states: {
            hover: {
              enabled: false
            },
            select: {
              enabled: false
            },
            inactive: {
              opacity: 1
            }
          }
        },
        plotOptions: {
          series: {
            animation: false,
            showInLegend: false
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

      while (this.chart.series.length) {
        this.chart.series[0].remove(false)
      }

      const series = this.profiles
        .filter(d => d.values && d.values.length > 0)
        .map(p => {
          const data = p.values
            .sort((a, b) => ascending(a.depth_m, b.depth_m))
            .map(v => [v.temp_c, v.depth_m])
          return {
            id: p.id,
            zIndex: 1,
            lineWidth: 1,
            marker: {
              symbol: 'circle',
              radius: 3
            },
            data,
            tooltip: {
              headerFormat: `Profile ID: <b>${p.id}</b><br>Date: <b>${formatTimestamp(p.date, 'DD')}</b><br>`
            }
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
