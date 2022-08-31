<template>
  <div>
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="error" v-else-if="profiles.length === 0" title="No Profiles Available" class="mb-0">
      This station does not have any vertical profiles.
    </Alert>
    <div v-else>
      <highcharts :options="chart"></highcharts>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StationDetailProfiles',
  props: ['station'],
  data () {
    return {
      loading: true,
      profiles: [],
      chart: {
        chart: {
          height: 400,
          marginLeft: 50,
          type: 'scatter'
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          pointFormat: 'Temperature: <b>{point.x} °C</b>',
          valueDecimals: 1
        },
        xAxis: {
          title: {
            text: 'Temperature (degC)',
            align: 'high',
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
      const response = await this.$http.public.get(`/stations/${this.station.id}/profiles/values`)
      const profiles = response.data
      this.profiles = profiles
      this.chart.series = profiles.map(p => ({
        name: p.date.substr(0, 10),
        zIndex: 1,
        lineWidth: 1,
        marker: {
          symbol: 'circle',
          radius: 3
        },
        data: p.values.map(v => {
          return [
            v.value,
            v.depth_m
          ]
        })
      }))
      this.loading = false
    }
  }
}
</script>

<style>

</style>
