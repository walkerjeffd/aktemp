<template>
  <v-main>
    <v-container class="black--text">
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4" class="pb-4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title class="text-h5">
                Database Administration
              </v-toolbar-title>
            </v-toolbar>
            <v-tabs class="elevation-2 mb-4" height="60" grow :vertical="$vuetify.breakpoint.mobile">
              <v-tab :to="{ name: 'adminRequests' }">
                <v-icon left>mdi-account-plus</v-icon> Account Requests
              </v-tab>
              <v-tab :to="{ name: 'adminUsers' }">
                <v-icon left>mdi-account-group</v-icon> Users
              </v-tab>
              <v-tab :to="{ name: 'adminOrganizations' }">
                <v-icon left>mdi-map-marker</v-icon> Organizations
              </v-tab>
            </v-tabs>
            <router-view></router-view>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
export default {
  name: 'AdminRoot'
}
</script>

<style>

</style>
