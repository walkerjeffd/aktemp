<template>
  <div style="width:100%">
    <Loading v-if="loading" :style="{ 'height': chart.chart.height - 16 + 'px' }"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data" class="mb-0">{{ error }}</Alert>
    <highcharts :options="chart" v-else></highcharts>
  </div>
</template>

<script>
export default {
  name: 'SeriesChart',
  props: ['series'],
  data () {
    return {
      loading: true,
      error: null,
      values: [],
      chart: {
        boost: {
          useGPUTranslations: true,
          seriesThreshold: 1
        },
        chart: {
          type: 'line',
          height: 300,
          marginLeft: 70,
          marginRight: 20,
          zoomType: 'x',
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
          line: {
            marker: {
              enabled: false
            }
          },
          series: {
            boostThreshold: 1,
            turboThreshold: 0
          }
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          pointFormat: 'Temperature: <b>{point.y}</b> degC'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: 'Temperature (degC)',
            margin: 14,
            style: {
              fontSize: '16px'
            }
          }
        },
        series: []
      }
    }
  },
  watch: {
    series () {
      this.fetch()
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.restricted.get(`/series/${this.series.id}/values`)
        const values = response.data
        this.chart.series = [{
          name: `Series ID=${this.series.id}`,
          data: values.map(v => {
            return [(new Date(v.datetime)).valueOf(), v.value]
          }),
          zones: [],
          zoneAxis: 'x',
          zIndex: 1
        }]
      } catch (err) {
        this.err = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style>

</style>
