<template>
  <div class="fill-height">
    <v-navigation-drawer app clipped dark expand-on-hover style="z-index:2000">
      <v-list-item link @click="pane = 'filters'">
        <v-list-item-icon>
          <v-icon>mdi-filter</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Filter Stations
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link @click="pane = 'map'">
        <v-list-item-icon>
          <v-icon>mdi-map</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Map Settings
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link @click="stationsTable.show = true">
        <v-list-item-icon>
          <v-icon>mdi-table</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Stations Table
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-navigation-drawer>
    <v-main class="fill-height">
      <div class="d-flex flex-row fill-height">
        <!-- FILTER -->
        <v-navigation-drawer color="grey darken-2" v-if="pane === 'filters'" width="350">
          <v-toolbar color="grey darken-2" dark flat dense>
            <div class="text-h6">Filter Stations</div>
            <v-spacer></v-spacer>
            <v-btn icon small @click="pane = null">
              <v-icon small>mdi-chevron-double-left</v-icon>
            </v-btn>
          </v-toolbar>
          <v-divider></v-divider>
          <div class="pa-4 white--text">
            <p class="font-weight-bold">Filter by Attributes (dropdown menus):</p>
            <ul class="mb-4">
              <li>Organization</li>
              <li>Waterbody Type (Stream/River, Lake, Unknown)</li>
              <li>Placement (Mainstem, Side, Unknown)</li>
              <li>Active (True, False, Unknown)</li>
              <li>Well-mixed (True, False, Unknown)</li>
            </ul>
            <p class="font-weight-bold">Filter by Data Types (toggle switches)</p>
            <ul class="mb-4">
              <li>Has Series (True/False)</li>
              <li>Has Profiles (True/False)</li>
            </ul>
            <p class="font-weight-bold">Filter by Time (calendar pickers):</p>
            <ul class="mb-4">
              <li>Min date</li>
              <li>Max date</li>
            </ul>
            <p class="font-weight-bold">Spatial Filter:</p>
            <ul class="mb-4">
              <li>Button to enable "draw" mode (user can then filter by drawing a bounding box or polygon)</li>
            </ul>
          </div>
        </v-navigation-drawer>
        <!-- SETTINGS -->
        <v-navigation-drawer color="grey darken-2" v-else-if="pane === 'map'" width="350">
          <v-toolbar color="grey darken-2" dark flat dense>
            <div class="text-h6">Map Settings</div>
            <v-spacer></v-spacer>
            <v-btn icon small @click="pane = null">
              <v-icon small>mdi-chevron-double-left</v-icon>
            </v-btn>
          </v-toolbar>
          <v-divider></v-divider>
          <div class="pa-4 white--text">
            <p class="font-weight-bold">Color Stations By (dropdown menu):</p>
            <ul class="mb-4">
              <li>Organization</li>
              <li>Waterbody Type</li>
              <li>Placement</li>
              <li>Active</li>
              <li>Well-mixed</li>
            </ul>
          </div>
        </v-navigation-drawer>
        <!-- MAP -->
        <div style="background-color:red;position:relative" class="flex-grow-1">
          <StationsMap
            :loading="loading"
            :stations="stations.filtered"
            :station="stations.selected"
            @select="select"
          />
          <StationsTable
            v-if="stationsTable.show"
            :loading="loading"
            :stations="stations.all"
            :filtered="stations.filtered"
            :selected="stations.selected"
            @select="select"
            @filter="filter"
            @close="stationsTable.show = false"
          />
          <StationDetail
            v-if="!!stations.selected"
            :station="stations.selected"
            @close="select"
          />
        </div>
      </div>
    </v-main>
  </div>
</template>

<script>
import StationsMap from '@/components/StationsMap'
import StationsTable from '@/components/StationsTable'
import StationDetail from '@/components/StationDetail'

export default {
  name: 'Explorer',
  components: {
    StationsMap,
    StationsTable,
    StationDetail
  },
  data () {
    return {
      loading: true,
      stations: {
        all: [],
        filtered: [],
        selected: null
      },
      tab: 0,
      pane: null,
      stationsTable: {
        show: false
      }
    }
  },
  async created () {
    try {
      const response = await this.$http.public.get('/stations')
      this.stations.all = response.data
      this.stations.filtered = this.stations.all
    } catch (e) {
      alert('Error occurred fetching stations')
      console.log(e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    select (station) {
      if (station && this.stations.selected !== station) {
        this.stations.selected = station
      } else {
        this.stations.selected = null
      }
    },
    filter (filtered) {
      this.stations.filtered = filtered

      if (!this.stations.filtered.includes(this.stations.selected)) {
        this.select()
      }
    }
  }
}
</script>
