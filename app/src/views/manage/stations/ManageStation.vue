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

            <Loading v-if="station.loading" class="mb-8"></Loading>
            <Alert type="error" title="Failed to Load Station" class="ma-4" v-else-if="station.error">
              {{ station.error }}
            </Alert>
            <v-container grid-list-xs v-else-if="station.data">
              <v-row>
                <v-col cols="12" lg="4">
                  <StationsMap
                    :stations="[station.data]"
                    :station="station.data"
                    style="height:300px"
                  ></StationsMap>
                  <ManageStationInfo :station="station.data" @refresh="fetchStation"></ManageStationInfo>
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
                              :columns="['id', 'start_datetime', 'end_datetime', 'depth', 'reviewed']"
                              @select="selectSeries"
                            ></SeriesTable>

                            <v-row v-if="series.selected" class="mt-4">
                              <v-col cols="12" xl="4">
                                <v-toolbar dense color="grey lighten-3" height="40px" elevation="2">
                                  <v-toolbar-title>
                                    <span class="text-overline">Selected Timeseries</span>
                                  </v-toolbar-title>
                                  <v-spacer></v-spacer>
                                  <v-btn icon x-small @click="selectSeries()" class="mr-0">
                                    <v-icon>mdi-close</v-icon>
                                  </v-btn>
                                </v-toolbar>

                                <div class="d-xl-none">
                                  <v-sheet elevation="2" class="pa-4">
                                    <SeriesChart
                                      :series="series.selected"
                                    ></SeriesChart>
                                  </v-sheet>
                                  <v-divider dark></v-divider>
                                </div>
                                <SeriesInfo
                                  :series="series.selected"
                                  @delete="onDeleteSeries"
                                ></SeriesInfo>
                              </v-col>
                              <v-col cols="12" xl="8">
                                <v-sheet elevation="2" class="pa-4 d-none d-xl-flex">
                                  <SeriesChart
                                    :series="series.selected"
                                  ></SeriesChart>
                                </v-sheet>
                              </v-col>
                            </v-row>
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
                              :columns="['id', 'date']"
                              @select="selectProfile"
                              v-else
                            ></ProfilesTable>

                            <div v-if="profiles.selected">
                              selected: {{ profiles.selected.id }}
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-tab-item>
                    </v-tabs-items>
                  </v-sheet>
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
import SeriesTable from '@/components/series/SeriesTable'
import ProfilesTable from '@/components/ProfilesTable'
import ManageStationInfo from '@/views/manage/stations/ManageStationInfo'
import SeriesInfo from '@/components/series/SeriesInfo'
import SeriesChart from '@/components/series/SeriesChart'

export default {
  name: 'ManageStation',
  components: {
    ManageStationInfo,
    StationsMap,
    SeriesTable,
    SeriesInfo,
    SeriesChart,
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
    onDeleteSeries () {
      this.selectSeries()
      this.fetchSeries()
    }
  }
}
</script>
