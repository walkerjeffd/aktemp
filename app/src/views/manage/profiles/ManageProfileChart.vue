<template>
  <v-sheet class="elevation-2 pb-8 px-4">
    <Loading v-if="loading" class="pt-4"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Profile Data">{{ error }}</Alert>
    <Alert v-else-if="values && values.length === 0" type="error" title="No Data">This profile does not have any data</Alert>
    <highcharts v-else :options="chart"></highcharts>
  </v-sheet>
</template>

<script>
export default {
  name: 'ManageProfileChart',
  props: ['profile'],
  data () {
    return {
      loading: true,
      error: null,
      values: [],
      chart: {
        chart: {
          height: 500,
          marginLeft: 60,
          marginRight: 20,
          type: 'scatter'
        },
        plotOptions: {
          scatter: {
            lineWidth: '0.5px'
          }
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          pointFormat: 'Depth: <b>{point.y}</b> m<br>Temp: <b>{point.x}</b> degC',
          headerFormat: ''
        },
        xAxis: {
          opposite: true,
          title: {
            text: 'Temperature (degC)',
            margin: 14,
            style: {
              fontSize: '16px'
            }
          }
        },
        yAxis: {
          title: {
            text: 'Depth (m)',
            margin: 14,
            style: {
              fontSize: '16px'
            }
          },
          reversed: true
        },
        series: []
      }
    }
  },
  mounted () {
    this.fetch()
  },
  watch: {
    profile () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.restricted.get(`/profiles/${this.$route.params.profileId}/values`)
        this.values = Object.freeze(response.data)
        this.chart.series = [{
          name: this.$route.params.profileId,
          marker: {
            enabled: true
          },
          data: this.values.map(v => {
            return [v.value, v.depth_m]
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
