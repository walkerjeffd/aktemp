<template>
  <v-sheet class="elevation-2 py-8 px-4">
    <Loading v-if="loading"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data">{{ error }}</Alert>
    <Alert v-else-if="values && values.length === 0" type="error" title="No Data">This timeseries does not have any data</Alert>
    <highcharts v-else :options="chart"></highcharts>
  </v-sheet>
</template>

<script>
export default {
  name: 'ManageSeriesChart',
  props: ['series'],
  data () {
    return {
      loading: true,
      error: null,
      values: [],
      chart: {
        chart: {
          zoomType: 'x',
          height: 300,
          marginLeft: 40,
          marginRight: 20,
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
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
            text: undefined
          }
        },
        series: []
      }
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
        const response = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/values`)
        this.values = Object.freeze(response.data)
        this.chart.series = [{
          name: this.$route.params.seriesId,
          marker: {
            enabled: false
          },
          data: this.values.map(v => {
            return [(new Date(v.datetime)).valueOf(), v.value]
          })
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
