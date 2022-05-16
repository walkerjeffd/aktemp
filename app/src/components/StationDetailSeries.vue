<template>
  <div>
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="error" v-else-if="series.length === 0" title="No Timeseries Data Available" class="mb-0">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <highcharts :options="chart"></highcharts>
      <div class="text--secondary caption text-right"><v-icon x-small>mdi-information-outline</v-icon> Click+drag to zoom in. Shift+click to slide.</div>
      <v-divider class="mt-2"></v-divider>
      <v-simple-table dense>
        <tbody>
          <tr>
            <td class="text-right grey--text text--darken-2" style="width:120px">
              # Timeseries
            </td>
            <td class="font-weight-bold">{{ series.length }}</td>
          </tr>
        </tbody>
      </v-simple-table>
      <v-divider class="mb-4"></v-divider>
      <div class="d-flex">
        <v-btn color="info" small disabled>
          <v-icon small left>mdi-chart-line</v-icon>
          Explore
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="info" small disabled>
          <v-icon small left>mdi-download</v-icon>
          Download
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StationSeriesChart',
  props: ['station'],
  data () {
    return {
      loading: true,
      series: [],
      chart: {
        plotOptions: {
          series: {
            boostThreshold: 1,
            turboThreshold: 0
          },
          arearange: {
            boostThreshold: 1,
            turboThreshold: 0
          }
        },
        chart: {
          zoomType: 'x',
          height: 200,
          marginLeft: 80,
          panning: true,
          panKey: 'shift',
          resetZoomButton: {
            position: {
              x: 0,
              y: 0
            }
          }
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          xDateFormat: '%b %d, %Y',
          pointFormat: 'Series {series.name}: <b>{point.y} ({point.low}-{point.high}) °C</b><br>',
          shared: true,
          valueDecimals: 1
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: 'Daily Mean (Range) Temp. (°C)'
          },
          startOnTick: false,
          endOnTick: false,
          tickAmount: 4
        },
        series: []
      }
    }
  },
  mounted () {
    this.fetch()
  },
  watch: {
    station () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      if (!this.station) return

      this.loading = true
      const response = await this.$http.public.get(`/stations/${this.station.id}/series`)
      const series = response.data
      for (let i = 0; i < series.length; i++) {
        const response = await this.$http.public.get(`/series/${series[i].id}/daily`)
        series[i].values = response.data
      }
      this.series = Object.freeze(series)
      this.chart.series = series.map(s => {
        return [
          {
            name: `${s.id}`,
            marker: {
              enabled: false
            },
            zIndex: 1,
            lineWidth: 1,
            data: s.values.map(v => {
              return {
                x: (new Date(v.date)).valueOf(),
                y: v.mean,
                low: v.min.toFixed(1),
                high: v.max.toFixed(1)
              }
            })
          },
          {
            name: `${s.id}-range`,
            type: 'arearange',
            data: s.values.map(v => {
              return {
                x: (new Date(v.date)).valueOf(),
                low: v.min,
                high: v.max
              }
            }),
            lineWidth: 0,
            linkedTo: ':previous',
            enableMouseTracking: false,
            color: 'black',
            fillOpacity: 0.2,
            zIndex: 0,
            label: {
              enabled: false
            },
            marker: {
              enabled: false
            }
          }
        ]
      }).flat()
      this.loading = false
    }
  }
}
</script>

<style>

</style>
