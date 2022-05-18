<template>
  <v-main>
    <v-container class="black--text">
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar dense flat color="grey lighten-3" height="60px">
              <v-toolbar-title class="text-h6">
                <span v-if="station">{{ station.code }}</span><span v-else>Loading...</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'explorer' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Explorer</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>
            <Loading v-if="stationStatus.loading" class="pb-8"></Loading>
            <Alert type="error" title="Failed to Load Station" class="ma-4" v-else-if="stationStatus.error">
              {{ stationStatus.error }}
            </Alert>

            <v-container grid-list-xs v-else-if="station" elevation="2">
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

                    <div class="pa-4">
                      <v-btn color="info" disabled>
                        <v-icon left>mdi-download</v-icon>
                        Download Station Info
                      </v-btn>
                    </div>
                  </v-sheet>
                </v-col>
                <v-col cols="12" lg="8">
                  <v-tabs class="elevation-2" grow :vertical="$vuetify.breakpoint.mobile">
                    <v-tab>
                      <v-icon left>mdi-chart-line</v-icon> Timeseries
                    </v-tab>
                    <v-tab>
                      <v-icon left>mdi-arrow-expand-down</v-icon> Profiles
                    </v-tab>

                    <!-- SERIES -->
                    <v-tab-item>
                      <ExplorerStationSeries :station="station"></ExplorerStationSeries>
                    </v-tab-item>
                    <!-- PROFILES -->
                    <v-tab-item>
                      <ExplorerStationProfiles :station="station"></ExplorerStationProfiles>
                    </v-tab-item>
                  </v-tabs>
                  <!-- <Alert type="error" title="Failed to Get Timeseries" v-if="seriesStatus.error">{{ seriesStatus.error }}</Alert> -->
                  <!-- <SeriesTable
                    :series="series"
                    :loading="seriesStatus.loading"
                    :columns="['id', 'start_datetime', 'end_datetime', 'depth_m', 'depth_category']"
                    @select="selectSeries"
                    v-else
                  ></SeriesTable> -->
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import StationsMap from '@/components/StationsMap'
import StationInfoTable from '@/components/StationInfoTable'
import ExplorerStationProfiles from '@/views/explorer/ExplorerStationProfiles'
import ExplorerStationSeries from '@/views/explorer/ExplorerStationSeries'

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
      seriesStatus: {
        loading: true,
        error: null
      },
      stationStatus: {
        loading: true,
        error: null
      },

      station: null,
      series: []
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
      this.stationStatus.error = null
      this.stationStatus.loading = true
      const stationId = this.$route.params.stationId
      try {
        const response = await this.$http.public.get(`/stations/${stationId}`)
        this.station = response.data
      } catch (err) {
        this.stationStatus.error = err.message || err.toString() || 'Unknown error'
      } finally {
        this.stationStatus.loading = false
      }
    }
  }
}
</script>

<style>

</style>
