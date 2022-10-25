<template>
  <div>
    <v-tabs class="elevation-2" grow :vertical="$vuetify.breakpoint.mobile">
      <v-tab :to="{ name: 'manageStations' }">
        <v-icon left>mdi-map-marker-multiple</v-icon> Stations
      </v-tab>
      <v-tab :to="{ name: 'manageFiles' }">
        <v-icon left>mdi-file-multiple-outline</v-icon> Files
      </v-tab>
      <v-tab :to="{ name: 'manageQaqc' }">
        <v-icon left>mdi-tools</v-icon> QAQC
      </v-tab>
    </v-tabs>

    <div class="mt-1 pa-4">
      <router-view></router-view>
    </div>
  </div>
  <!-- <v-card elevation="4">
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
          :disabled="organizationsStatus.loading"
          style="z-index:2000"
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
      <v-tab :to="{ name: 'manageQaqc' }">
        <v-icon left>mdi-tools</v-icon> QAQC
      </v-tab>
    </v-tabs>

    <div class="mt-1 pa-4">
      <router-view></router-view>
    </div>
  </v-card> -->
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageOrganization'
  // computed: {
  //   ...mapGetters({
  //     organizations: 'manage/organizations',
  //     organizationsStatus: 'manage/organizationsStatus'
  //   }),
  //   organization: {
  //     get () {
  //       return this.$store.state.manage.organization
  //     },
  //     set (value) {
  //       console.log(this.$route)
  //       this.$router.push({
  //         name: 'manageOrganization',
  //         params: {
  //           organizationId: value.id
  //         }
  //       })
  //     }
  //   }
  // },
  // watch: {
  //   organization () {
  //     console.log('ManageOrganization:watch(organization)', this.organization)
  //     // if (!this.organization) return
  //     // if (this.$route.params.organizationId === this.organization.id) return
  //     // this.setOrganizationById(this.organization.id)
  //   },
  //   organizations () {
  //     console.log('ManageOrganization:watch(organizations)', this.organizations)
  //     this.setOrganization()
  //   }
  // },
  // mounted () {
  //   console.log('ManageOrganization:mounted', this.$route.params.organizationId)
  // },
  // methods: {
  //   setOrganization () {
  //     console.log('ManageOrganization:setOrganization()', this.$route.params.organizationId)
  //     this.$store.dispatch('manage/setOrganizationById', this.$route.params.organizationId)
  //   }
  // }
}
</script>
