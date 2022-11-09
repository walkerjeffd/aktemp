<template>
  <v-main>
    <v-container class="black--text">
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar dense flat color="grey lighten-3" height="60px">
              <v-toolbar-title class="text-h6">
                Station: <span v-if="station">{{ station.code }}</span><span v-else>Loading...</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'explorer' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Explorer</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <v-card-text>
              <Loading v-if="status.loading" class="pb-8"></Loading>
              <Alert v-else-if="status.error" type="error" title="Failed to Load Station" class="mb-0">
                {{ status.error }}
              </Alert>
              <v-container grid-list-xs v-else-if="station" elevation="2" class="pa-0">
                <v-row>
                  <v-col cols="12" lg="4">
                    <v-sheet elevation="2">
                      <StationsMap
                        :stations="[station]"
                        :station="station"
                        style="height:300px"
                      ></StationsMap>
                      <StationInfoTable :station="station"></StationInfoTable>

                      <v-divider></v-divider>

                      <div class="pa-4 text-right">
                        <DownloadButton @click="downloadStation" text="Download Metadata"></DownloadButton>
                      </div>
                    </v-sheet>
                  </v-col>
                  <v-col cols="12" lg="8">
                    <v-tabs class="elevation-2" grow v-model="tab">
                      <v-tab>
                        <v-icon left>mdi-chart-line</v-icon> Timeseries
                      </v-tab>
                      <v-tab>
                        <v-icon left>mdi-arrow-expand-down</v-icon> Profiles
                      </v-tab>
                      <!-- SERIES -->
                      <v-tab-item>
                        <v-divider></v-divider>
                        <ExplorerStationSeries :station="station"></ExplorerStationSeries>
                      </v-tab-item>
                      <!-- PROFILES -->
                      <v-tab-item>
                        <v-divider></v-divider>
                        <ExplorerStationProfiles :station="station"></ExplorerStationProfiles>
                      </v-tab-item>
                    </v-tabs>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import StationsMap from '@/components/StationsMap'
import StationInfoTable from '@/components/StationInfoTable'
import ExplorerStationProfiles from '@/views/explorer/station/ExplorerStationProfiles'
import ExplorerStationSeries from '@/views/explorer/station/ExplorerStationSeries'

export default {
  name: 'ExplorerStation',
  components: {
    StationsMap,
    StationInfoTable,
    ExplorerStationProfiles,
    ExplorerStationSeries
  },
  data () {
    return {
      tab: 0,
      status: {
        loading: true,
        error: null
      },
      station: null
    }
  },
  watch: {
    '$route.params.stationId' () {
      this.fetchStation()
    }
  },
  mounted () {
    this.fetchStation()
  },
  methods: {
    async fetchStation () {
      this.status.error = null
      this.status.loading = true
      const stationId = this.$route.params.stationId
      try {
        this.station = await this.$http.public.get(`/stations/${stationId}`)
          .then(d => d.data)
      } catch (err) {
        this.status.error = err.message || err.toString() || 'Unknown error'
      } finally {
        this.status.loading = false
      }
    },
    async downloadStation () {
      const series = await this.$http.public.get(`/stations/${this.station.id}/series`)
        .then(d => d.data)
      const profiles = await this.$http.public.get(`/stations/${this.station.id}/profiles`)
        .then(d => d.data)
      this.$download.stationMetadata(`AKTEMP-${this.station.organization_code}-${this.station.code}-station.csv`, this.station, series, profiles)
    }
  }
}
</script>

<style>

</style>
