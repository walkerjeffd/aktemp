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
      <v-tab :to="{ name: 'manageExport' }">
        <v-icon left>mdi-download</v-icon> Export
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
          :items="providers"
          v-model="provider"
          label="Provider"
          item-text="code"
          dense
          required
          outlined
          return-object
          hide-details
          :disabled="providersStatus.loading"
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
  name: 'ManageProvider'
  // computed: {
  //   ...mapGetters({
  //     providers: 'manage/providers',
  //     providersStatus: 'manage/providersStatus'
  //   }),
  //   provider: {
  //     get () {
  //       return this.$store.state.manage.provider
  //     },
  //     set (value) {
  //       console.log(this.$route)
  //       this.$router.push({
  //         name: 'manageProvider',
  //         params: {
  //           providerId: value.id
  //         }
  //       })
  //     }
  //   }
  // },
  // watch: {
  //   provider () {
  //     console.log('ManageProvider:watch(provider)', this.provider)
  //     // if (!this.provider) return
  //     // if (this.$route.params.providerId === this.provider.id) return
  //     // this.setProviderById(this.provider.id)
  //   },
  //   providers () {
  //     console.log('ManageProvider:watch(providers)', this.providers)
  //     this.setProvider()
  //   }
  // },
  // mounted () {
  //   console.log('ManageProvider:mounted', this.$route.params.providerId)
  // },
  // methods: {
  //   setProvider () {
  //     console.log('ManageProvider:setProvider()', this.$route.params.providerId)
  //     this.$store.dispatch('manage/setProviderById', this.$route.params.providerId)
  //   }
  // }
}
</script>
