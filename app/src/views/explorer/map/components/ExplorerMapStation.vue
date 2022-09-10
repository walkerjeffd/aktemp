<template>
  <v-sheet
    elevation="20"
    width="400"
    class="aktemp-explorer-map-station-container"
  >
    <v-toolbar color="grey darken-2" dark flat dense>
      <div class="font-weight-bold body-1">{{ station.code | truncate(25) }}</div>
      <v-spacer></v-spacer>
      <v-btn icon small @click="zoomTo">
        <v-icon small>mdi-target</v-icon>
      </v-btn>
      <v-btn icon small @click="collapse = !collapse">
        <v-icon small v-if="collapse">mdi-menu-down</v-icon>
        <v-icon small v-else>mdi-menu-up</v-icon>
      </v-btn>
      <v-btn icon small @click="$emit('close')">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <div v-if="!collapse">
      <div class="d-flex pa-4">
        <v-btn
          color="info"
          block
          title="Explore timeseries and profile data in more detail"
          :to="{ name: 'explorerStation', params: { stationId: station.id }}"
        >
          <v-icon left>mdi-chart-line</v-icon>
          Explore Station Data
          <v-icon right>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-divider></v-divider>

      <!-- <v-toolbar color="grey lighten-2" dense height="40" class="text-overline">
        Preview Summary
      </v-toolbar> -->

      <v-tabs
        v-model="tab"
        color="#00573d"
        dense
        fixed-tabs
      >
        <v-tab><v-icon left small>mdi-information-outline</v-icon> Info</v-tab>
        <v-tab :disabled="station && station.n_series === 0"><v-icon left small>mdi-chart-line</v-icon> Timeseries</v-tab>
        <v-tab><v-icon left small>mdi-arrow-expand-down</v-icon> Profiles</v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <v-tabs-items v-model="tab">
        <!-- INFO -->
        <v-tab-item class="pt-2">
          <ExplorerMapStationInfo :station="station"></ExplorerMapStationInfo>
        </v-tab-item>

        <!-- TIMESERIES -->
        <v-tab-item>
          <ExplorerMapStationSeries :station="station"></ExplorerMapStationSeries>
        </v-tab-item>

        <!-- PROFILES -->
        <v-tab-item>
          <ExplorerMapStationProfiles :station="station"></ExplorerMapStationProfiles>
        </v-tab-item>
      </v-tabs-items>
    </div>

  </v-sheet>
</template>

<script>
import evt from '@/events'
import ExplorerMapStationInfo from '@/views/explorer/map/components/ExplorerMapStationInfo'
import ExplorerMapStationSeries from '@/views/explorer/map/components/ExplorerMapStationSeries'
import ExplorerMapStationProfiles from '@/views/explorer/map/components/ExplorerMapStationProfiles'
export default {
  name: 'ExplorerMapStation',
  components: {
    ExplorerMapStationInfo,
    ExplorerMapStationSeries,
    ExplorerMapStationProfiles
  },
  props: ['station'],
  data () {
    return {
      collapse: false,
      tab: 0
    }
  },
  methods: {
    zoomTo () {
      evt.$emit('map:zoomToStation', this.station)
    }
  }
}
</script>

<style scoped>
.aktemp-explorer-map-station-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: auto;
}
</style>
