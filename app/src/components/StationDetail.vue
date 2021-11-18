<template>
  <div style="position:absolute;top:20px;right:20px;z-index:3000;width:400px;background-color:white;margin:auto;pointer-events:auto" class="elevation-20">
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
    <v-divider v-if="!collapse"></v-divider>
    <div v-if="!collapse">
      <v-tabs
        v-model="tab"
        color="#00573d"
        dense
      >
        <v-tab>Info</v-tab>
        <v-tab>Data</v-tab>

        <v-tab-item>
          <v-simple-table dense>
            <tbody>
              <tr>
                <td class="text-right grey--text text--darken-2" style="width:140px">
                  Organization
                </td>
                <td class="font-weight-bold">{{ station.organization_id }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2" style="width:0px">
                  Code
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
                <td class="font-weight-bold">{{ station.waterbody_type || 'N/A' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Placement
                </td>
                <td class="font-weight-bold">{{ station.placement || 'Unknown' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Fully Mixed
                </td>
                <td class="font-weight-bold">{{ station.mixed || 'Unknown' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Active
                </td>
                <td class="font-weight-bold">{{ station.active || 'Unknown' }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-tab-item>
        <v-tab-item class="pa-4">
          Data summary
        </v-tab-item>
      </v-tabs>
    </div>
  </div>
</template>

<script>
import evt from '@/events'
export default {
  name: 'StationDetail',
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
