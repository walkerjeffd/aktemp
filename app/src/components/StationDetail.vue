<template>
  <div style="position:absolute;top:20px;right:20px;z-index:1000;width:400px;background-color:white;margin:auto;pointer-events:auto" class="elevation-20">
    <v-toolbar color="grey darken-2" dark flat dense>
      <div class="font-weight-bold body-1">{{ station.code }}</div>
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
      <v-divider></v-divider>
      <div>
        <v-tabs
          v-model="tab"
          color="#00573d"
          dense
          fixed-tabs
        >
          <v-tab><v-icon left small>mdi-information-outline</v-icon> Info</v-tab>
          <v-tab :disabled="station && station.n_series === 0"><v-icon left small>mdi-chart-line</v-icon> Timeseries</v-tab>
          <v-tab><v-icon left small>mdi-arrow-expand-down</v-icon> Profiles</v-tab>

          <!-- INFO -->
          <v-tab-item>
            <v-simple-table dense class="pt-4">
              <tbody>
                <tr>
                  <td class="text-right grey--text text--darken-2" style="width:140px">
                    Organization
                  </td>
                  <td class="font-weight-bold">{{ station.organization_code }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2" style="width:0px">
                    Station Code
                  </td>
                  <td class="font-weight-bold">{{ station.code }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Latitude
                  </td>
                  <td class="font-weight-bold">{{ station.latitude.toFixed(6) }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Longitude
                  </td>
                  <td class="font-weight-bold">{{ station.longitude.toFixed(6) }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Waterbody Name
                  </td>
                  <td class="font-weight-bold">{{ station.waterbody_name || 'N/A' }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Waterbody Type
                  </td>
                  <td class="font-weight-bold">{{ station.waterbody_type || 'UNKNOWN' }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Placement
                  </td>
                  <td class="font-weight-bold">{{ station.placement || 'UNKNOWN' }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Fully Mixed
                  </td>
                  <td class="font-weight-bold">{{ station.mixed | formatBooleanOption }}</td>
                </tr>
                <tr>
                  <td class="text-right grey--text text--darken-2">
                    Active
                  </td>
                  <td class="font-weight-bold">{{ station.active | formatBooleanOption }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-tab-item>

          <!-- TIMESERIES -->
          <v-tab-item class="pa-4">
            <StationDetailSeries :station="station"></StationDetailSeries>
          </v-tab-item>

          <!-- PROFILES -->
          <v-tab-item class="pa-4">
            <StationDetailProfiles :station="station"></StationDetailProfiles>
          </v-tab-item>
        </v-tabs>

        <v-divider></v-divider>

        <div class="d-flex pa-4">
          <v-btn color="info" block :to="{ name: 'explorerStation', params: { stationId: station.id }}">
            <v-icon left>mdi-chart-line</v-icon>
            Explore
          </v-btn>
          <!-- <v-spacer></v-spacer>
          <v-btn color="info" disabled>
            <v-icon left>mdi-download</v-icon>
            Download
          </v-btn> -->
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import evt from '@/events'
import StationDetailSeries from '@/components/StationDetailSeries'
import StationDetailProfiles from '@/components/StationDetailProfiles'
export default {
  name: 'StationDetail',
  components: {
    StationDetailSeries,
    StationDetailProfiles
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
