<template>
  <v-card elevation="2">
    <v-toolbar flat dense>
      <v-toolbar-title>
        <span class="text-h6">Station: {{ station.data ? station.data.code : 'Loading...' }}</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small @click="$router.push({ name: 'manageStations' })">
        <v-icon small left>mdi-chevron-left</v-icon> Back to Stations
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>

    <Loading v-if="station.loading" class="pb-8"></Loading>
    <Alert type="error" title="Failed to Load Station" class="ma-4 mb-8" v-else-if="station.error">
      {{ station.error }}
    </Alert>
    <v-container grid-list-xs v-else-if="station.data">
      <v-row>
        <v-col cols="12" lg="4">
          <v-card>
            <StationsMap
              :stations="[station.data]"
              :station="station.data"
              style="height:300px"
            ></StationsMap>

            <div>
              <v-img v-if="station.data.photo_url" :src="station.data.photo_url" contain class="my-4 mx-auto elevation-2"></v-img>
              <div v-else>
                <div class="text-center my-4">
                  <v-icon size="80" color="grey lighten-1">mdi-camera</v-icon>
                  <div class="text-body-1 grey--text text--darken-1 mt-2">No Station Photo Available</div>
                </div>
              </div>
            </div>

            <v-divider></v-divider>

            <ManageStationInfo :station="station.data" @refresh="fetchStation"></ManageStationInfo>
          </v-card>
        </v-col>
        <v-col cols="12" lg="8">
          <v-sheet elevation="2">
            <v-tabs
              v-model="tab"
              background-color="grey lighten-3"
              fixed-tabs
              centered
            >
              <v-tabs-slider></v-tabs-slider>

              <v-tab href="#series">
                <v-icon left>mdi-chart-line</v-icon>
                Timeseries
              </v-tab>

              <v-tab href="#profiles">
                <v-icon left>mdi-arrow-expand-down</v-icon>
                Profiles
              </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab">
              <v-tab-item
                value="series"
              >
                <v-card>
                  <v-card-text>
                    <Alert
                      v-if="series.error"
                      type="error"
                      title="Failed to Get Timeseries"
                    >{{ series.error }}</Alert>

                    <SeriesTable
                      v-else
                      :series="series.data"
                      :selected="series.selected"
                      :loading="series.loading"
                      :columns="['id', 'start_datetime', 'end_datetime', 'depth_m', 'interval', 'reviewed']"
                      @select="selectSeries"
                    ></SeriesTable>

                    <SelectedSeriesCard
                      v-if="series.selected"
                      :series="series.selected"
                      @close="selectSeries()"
                      @refresh="refreshSeries()"
                    ></SelectedSeriesCard>
                  </v-card-text>
                </v-card>
              </v-tab-item>
              <v-tab-item
                value="profiles"
              >
                <v-card flat>
                  <v-card-text>
                    <Alert type="error" title="Failed to Get Vertical Profiles" v-if="profiles.error">{{ profiles.error }}</Alert>
                    <ProfilesTable
                      :profiles="profiles.data"
                      :selected="profiles.selected"
                      :loading="profiles.loading"
                      @select="selectProfile"
                      v-else
                    ></ProfilesTable>

                    <SelectedProfileCard
                      v-if="profiles.selected"
                      :profile="profiles.selected"
                      @close="selectProfile()"
                      @refresh="refreshProfiles()"
                    ></SelectedProfileCard>
                  </v-card-text>
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import StationsMap from '@/components/StationsMap'
import SeriesTable from '@/components/series/SeriesTable'
import ProfilesTable from '@/components/profiles/ProfilesTable'
import ManageStationInfo from '@/views/manage/stations/ManageStationInfo'
import SelectedSeriesCard from '@/components/series/SelectedSeriesCard.vue'
import SelectedProfileCard from '@/components/profiles/SelectedProfileCard.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageStation',
  components: {
    ManageStationInfo,
    StationsMap,
    SeriesTable,
    SelectedSeriesCard,
    SelectedProfileCard,
    ProfilesTable
  },
  data () {
    return {
      tab: 'series',
      station: {
        loading: true,
        error: null,
        data: null
      },
      series: {
        loading: true,
        error: false,
        data: [],
        selected: null
      },
      profiles: {
        loading: true,
        error: false,
        data: [],
        selected: null
      }
    }
  },
  computed: {
    ...mapGetters({
      provider: 'manage/provider'
    })
  },
  watch: {
    provider () {
      if (!this.station.data || !this.provider) return
      if (this.station.data.provider_id !== this.provider.id) {
        this.$router.push({
          name: 'manageStations'
        })
      }
    }
  },
  mounted () {
    this.fetchStation()
    this.fetchSeries()
    this.fetchProfiles()
  },
  methods: {
    async fetchStation () {
      this.station.loading = true
      this.station.error = null
      try {
        const response = await this.$http.restricted.get(`/stations/${this.$route.params.stationId}`)
        this.station.data = response.data
      } catch (err) {
        this.station.error = err.toString() || 'Unknown error'
      } finally {
        this.station.loading = false
      }
    },
    async fetchSeries () {
      this.series.loading = true
      this.series.error = null
      try {
        const response = await this.$http.restricted.get(`/stations/${this.$route.params.stationId}/series`)
        this.series.data = response.data
      } catch (err) {
        this.series.error = err.toString() || 'Unknown error'
      } finally {
        this.series.loading = false
      }
    },
    async fetchProfiles () {
      this.profiles.loading = true
      this.profiles.error = null
      try {
        const response = await this.$http.restricted.get(`/stations/${this.$route.params.stationId}/profiles`)
        this.profiles.data = response.data
      } catch (err) {
        this.profiles.error = err.toString() || 'Unknown error'
      } finally {
        this.profiles.loading = false
      }
    },
    selectSeries (series) {
      if (!series) {
        this.series.selected = null
      } else if (this.series.selected === series) {
        this.series.selected = null
      } else {
        this.series.selected = series
      }
    },
    selectProfile (profile) {
      if (!profile) {
        this.profiles.selected = null
      } else if (this.profiles.selected === profile) {
        this.profiles.selected = null
      } else {
        this.profiles.selected = profile
      }
    },
    async refreshSeries () {
      let id
      if (this.series.selected) {
        id = this.series.selected.id
      }
      this.selectSeries()
      await this.fetchSeries()
      if (id) {
        const series = this.series.data.find(d => d.id === id)
        if (series) this.selectSeries(series)
      }
    },
    async refreshProfiles () {
      let id
      if (this.profiles.selected) {
        id = this.profiles.selected.id
      }
      this.selectProfile()
      await this.fetchProfiles()
      if (id) {
        const profile = this.profiles.data.find(d => d.id === id)
        if (profile) this.selectProfile(profile)
      }
    }
  }
}
</script>
