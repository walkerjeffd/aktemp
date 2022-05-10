<template>
  <v-main>
    <v-container class="black--text">
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar dense flat color="grey lighten-3" height="60px">
              <v-toolbar-title class="text-h6">
                Manage Data
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <div style="width:300px">
                <v-select
                  :items="organizations"
                  v-model="organization"
                  label="Organization"
                  item-text="code"
                  dense
                  required
                  outlined
                  return-object
                  hide-details
                ></v-select>
              </div>
            </v-toolbar>

            <v-tabs class="elevation-2" grow :vertical="$vuetify.breakpoint.mobile">
              <v-tab :to="{ name: 'manageStations' }">
                <v-icon left>mdi-map-marker-multiple</v-icon> Stations
              </v-tab>
              <v-tab :to="{ name: 'manageFiles' }">
                <v-icon left>mdi-file-multiple-outline</v-icon> Files
              </v-tab>
              <v-tab :to="{ name: 'manageSeries' }">
                <v-icon left>mdi-chart-line</v-icon> Timeseries
              </v-tab>
              <v-tab :to="{ name: 'manageProfiles' }">
                <v-icon left>mdi-arrow-expand-down</v-icon> Profiles
              </v-tab>
              <v-tab :to="{ name: 'manageQaqc' }">
                <v-icon left>mdi-tools</v-icon> QAQC
              </v-tab>
            </v-tabs>

            <div class="mt-1 pa-4">
              <router-view></router-view>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Manage',
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations'
    }),
    organization: {
      get () {
        return this.$store.state.manage.organization
      },
      set (value) {
        this.$store.dispatch('manage/setOrganization', value)
      }
    }
  },
  mounted () {
    this.$store.dispatch('manage/fetchOrganizations')
  }
}
</script>
