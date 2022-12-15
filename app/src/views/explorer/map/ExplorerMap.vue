<template>
  <div class="fill-height">
    <v-main class="fill-height">
     <div style="height:100%">
        <StationsMap
          :loading="stationsStatus.loading"
          :stations="stations.filtered"
          :station="stations.selected"
          :selected-huc="huc.selected"
          @select="select"
          @select-huc="selectHuc"
        />
        <ExplorerMapStationsTable
          v-show="show.stationsTable"
          :loading="stationsStatus.loading"
          :stations="stations.all"
          :selected="stations.selected"
          :selected-huc="huc.selected"
          @select="select"
          @filter="filter"
          @unselectHuc="selectHuc"
          @close="show.stationsTable = false"
        />
        <ExplorerMapStation
          v-if="!!stations.selected"
          :station="stations.selected"
          @close="select"
        />
      </div>
    </v-main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import evt from '@/events'

import StationsMap from '@/components/StationsMap'
import ExplorerMapStationsTable from '@/views/explorer/map/ExplorerMapStationsTable'
import ExplorerMapStation from '@/views/explorer/map/ExplorerMapStation'

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
      },
      huc: {
        selected: null
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
    },
    'stationsStatus.error' () {
      this.checkStationsError()
    }
  },
  async created () {
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
    selectHuc (feature) {
      if (feature && this.huc.selected && feature.id === this.huc.selected.id) {
        feature = null
      }
      this.huc.selected = feature
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
