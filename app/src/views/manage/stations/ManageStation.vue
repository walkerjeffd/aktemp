<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Manage Station</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageStations' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Stations</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>
            <!-- <v-tabs class="elevation-2 mb-4" height="60" grow :vertical="$vuetify.breakpoint.mobile">
              <v-tab :to="{ name: 'manageStation' }" exact>
                <v-icon left>mdi-map-marker</v-icon> Information
              </v-tab>
              <v-tab :to="{ name: 'manageImagesets' }" exact>
                <v-icon left>mdi-image-multiple-outline</v-icon> Photos
              </v-tab>
              <v-tab :to="{ name: 'manageDatasets' }" exact>
                <v-icon left>mdi-chart-line</v-icon> Data
              </v-tab>
            </v-tabs>
            <router-view></router-view> -->
            <ManageStationInfo></ManageStationInfo>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import ManageStationInfo from '@/views/manage/stations/ManageStationInfo'

export default {
  name: 'ManageStation',
  components: {
    ManageStationInfo
  }
}
</script>
