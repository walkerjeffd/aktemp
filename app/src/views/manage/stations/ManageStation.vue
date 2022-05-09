<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4" class="pb-2">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Manage Station</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageStations' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Stations</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <Loading v-if="stationStatus.loading" class="mb-8"></Loading>
            <Alert type="error" title="Failed to Load Station" class="ma-4" v-else-if="stationStatus.error">
              {{ stationStatus.error }}
            </Alert>
            <v-container grid-list-xs v-else-if="station">
              <v-row>
                <v-col cols="12" lg="4">
                  <StationsMap
                    :stations="[station]"
                    :station="station"
                    style="height:300px"
                  ></StationsMap>
                  <ManageStationInfo :station="station" @refresh="fetchStation"></ManageStationInfo>
                </v-col>
                <v-col cols="12" lg="8">
                  <Alert type="error" title="Failed to Get Timeseries" v-if="seriesStatus.error">{{ seriesStatus.error }}</Alert>
                  <SeriesTable
                    :series="series"
                    :loading="seriesStatus.loading"
                    :columns="['id', 'start_datetime', 'end_datetime', 'depth_m', 'depth_category']"
                    @select="selectSeries"
                    v-else
                  ></SeriesTable>
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
import SeriesTable from '@/components/SeriesTable'
import ManageStationInfo from '@/views/manage/stations/ManageStationInfo'

export default {
  name: 'ManageStation',
  components: {
    ManageStationInfo,
    StationsMap,
    SeriesTable
  },
  data () {
    return {
      stationStatus: {
        loading: true,
        error: null
      },
      station: null,
      seriesStatus: {
        loading: true,
        error: false
      },
      series: []
    }
  },
  mounted () {
    this.fetchStation()
    this.fetchSeries()
  },
  methods: {
    async fetchStation () {
      this.stationStatus.loading = true
      this.stationStatus.error = null
      try {
        const response = await this.$http.restricted.get(`/stations/${this.$route.params.stationId}`)
        this.station = response.data
      } catch (err) {
        this.stationStatus.error = err.toString() || 'Unknown error'
      } finally {
        this.stationStatus.loading = false
      }
    },
    async fetchSeries () {
      this.seriesStatus.loading = true
      this.seriesStatus.error = null
      try {
        const response = await this.$http.restricted.get(`/stations/${this.$route.params.stationId}/series`)
        this.series = response.data
      } catch (err) {
        this.seriesStatus.error = err.toString() || 'Unknown error'
      } finally {
        this.seriesStatus.loading = false
      }
    },
    selectSeries (series) {
      if (!series) return
      this.$router.push({ name: 'manageSeriesOne', params: { seriesId: series.id, from: 'station' } })
    }
  }
}
</script>
