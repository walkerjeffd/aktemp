<template>
  <div class="py-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="info" v-else-if="profiles.length === 0" title="No Profiles Available" class="mb-0 mx-4">
      This station does not have any vertical profile data.
    </Alert>
    <div v-else>
      <div class="mx-4">
        <highcharts :options="settings"></highcharts>
        <!-- <div class="text--secondary caption"><v-icon x-small>mdi-information</v-icon> Click+drag to zoom in. Shift+click to slide.</div> -->

        <div class="text--secondary caption ml-2">
          <v-icon x-small>mdi-information</v-icon> Click+drag to zoom in, hold shift to pan.
        </div>

        <div class="text-right d-flex align-end mt-4">
          <v-btn x-small text @click="about = !about">
            About This Chart
            <v-icon v-if="about" x-small right>mdi-chevron-up-circle-outline</v-icon>
            <v-icon v-else x-small right>mdi-chevron-down-circle-outline</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <DownloadButton @click="download" text="Download" small />
        </div>

        <div class="text--secondary caption ml-2 mt-4" v-if="about">
          This chart shows all available vertical profiles at this station. Click <code>Explore Data</code> below to view the individual profiles. Click <code>Download</code> to download a file containing the profiles shown above.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ascending } from 'd3'
import { writeStationProfilesFile } from 'aktemp-utils/downloads'

export default {
  name: 'ExplorerMapStationProfiles',
  props: ['station'],
  data () {
    return {
      loading: true,
      about: false,
      profiles: [],
      settings: {
        chart: {
          panKey: 'shift',
          panning: {
            enabled: true,
            type: 'xy'
          },
          zoomType: 'xy',
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
      this.profiles = Object.freeze(profiles)
      this.settings.series = profiles.map(p => ({
        name: p.date.substr(0, 10),
        zIndex: 1,
        lineWidth: 1,
        marker: {
          symbol: 'circle',
          radius: 3
        },
        data: p.values.sort((a, b) => ascending(a.depth_m, b.depth_m)).map(v => {
          return [
            v.temp_c,
            v.depth_m
          ]
        })
      }))
      this.loading = false
    },
    download () {
      const filename = `AKTEMP-${this.station.provider_code}-${this.station.code}-profiles.csv`
      const providers = this.$store.state.explorer.providers.filter(d => d.id === this.station.provider_id)
      const body = writeStationProfilesFile(providers, this.station, this.profiles)
      this.$download(body, filename)
    }
  }
}
</script>

<style>

</style>
