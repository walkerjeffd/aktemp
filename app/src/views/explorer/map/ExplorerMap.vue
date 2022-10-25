<template>
  <div class="fill-height">
    <v-main class="fill-height">
     <div style="background-color:red;height:100%">
        <StationsMap
          :loading="stationsStatus.loading"
          :stations="stations.filtered"
          :station="stations.selected"
          @select="select"
        />
        <ExplorerMapStationsTable
          v-show="show.stationsTable"
          :loading="stationsStatus.loading"
          :stations="stations.all"
          :selected="stations.selected"
          @select="select"
          @filter="filter"
          @close="show.stationsTable = false"
        />
        <ExplorerMapStation
          v-if="!!stations.selected"
          :station="stations.selected"
          @close="select"
        />
      </div>
    </v-main>
    <v-navigation-drawer
      app
      clipped
      dark
      absolute
      mini-variant
      expand-on-hover
      color="grey darken-2"
      style="z-index:1000"
      elevation="2"
    >
      <v-list nav>
        <v-list-item>
          <v-list-item-icon class="pull-right">
            <v-icon>mdi-map</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="font-weight-bold">Map Options</v-list-item-title>
          <v-list-item-content>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import evt from '@/events'

import StationsMap from '@/components/StationsMap'
import ExplorerMapStationsTable from '@/views/explorer/map/components/ExplorerMapStationsTable'
import ExplorerMapStation from '@/views/explorer/map/components/ExplorerMapStation'

const { waterbodyTypeOptions } = require('aktemp-utils/constants')

export default {
  name: 'Explorer',
  components: {
    StationsMap,
    ExplorerMapStationsTable,
    ExplorerMapStation
  },
  data () {
    return {
      tab: 0,
      sidebar: true,
      pane: null,
      show: {
        stationsTable: true
      },
      stations: {
        all: [],
        filtered: [],
        selected: null
      },
      filters: {
        waterbodyType: {
          selected: [],
          options: waterbodyTypeOptions
        },
        active: false,
        series: false,
        profiles: false
      }
    }
  },
  computed: {
    ...mapGetters({
      storeStations: 'explorer/stations',
      stationsStatus: 'explorer/stationsStatus',
      organizationsStatus: 'explorer/organizationsStatus'
    })
  },
  watch: {
    storeStations () {
      this.stations.all = this.storeStations
      // const mockStations = require('../../../../../r/export/mock/stations.json')
      // this.stations.all = mockStations.slice(0, 1000)
    },
    'stationsStatus.error' () {
      this.checkStationsError()
    }
  },
  async created () {
    // try {
    //   const response = await this.$http.public.get('/stations')
    //   this.stations.all = response.data
    //   this.stations.filtered = this.stations.all
    // } catch (e) {
    //   alert('Error occurred fetching stations')
    //   console.log(e)
    // } finally {
    //   this.loading = false
    // }
    this.$store.dispatch('explorer/fetchOrganizations')
    this.$store.dispatch('explorer/fetchStations')
    this.checkStationsError()
  },
  methods: {
    checkStationsError () {
      if (this.stationsStatus.error) {
        evt.$emit('notify', `Failed to get stations: ${this.stationsStatus.error}`, 'error')
      }
    },
    select (station) {
      if (station && this.stations.selected !== station) {
        this.stations.selected = station
      } else {
        this.stations.selected = null
      }
    },
    filter (filteredStations) {
      this.stations.filtered = filteredStations

      if (!this.stations.filtered.includes(this.stations.selected)) {
        this.select()
      }
    }
  }
}
</script>
