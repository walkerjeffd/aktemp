<template>
  <v-main>
    <v-container class="black--text">
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar dense flat color="grey lighten-3">
              <v-toolbar-title class="text-h6">
                Manage Data
              </v-toolbar-title>
            </v-toolbar>

            <v-tabs class="elevation-2 mb-4" height="60" grow :vertical="$vuetify.breakpoint.mobile">
              <v-tab :to="{ name: 'manageStations' }">
                <v-icon left>mdi-map-marker-multiple</v-icon> Stations
              </v-tab>
              <v-tab :to="{ name: 'manageFiles' }">
                <v-icon left>mdi-file-multiple-outline</v-icon> Files
              </v-tab>
            </v-tabs>
            <router-view></router-view>

            <v-card-text class="pt-2">
              <!-- <v-container class="black--text body-1 px-0">
                <v-row align="stretch">
                  <v-col cols="12" md="6">
                    <v-card elevation="2" height="100%">
                      <v-card-title class="text-h5 py-2">
                        Instructions
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-card-text class="black--text body-1">
                        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Deserunt quod tempore reprehenderit consequatur impedit ipsum. Voluptate, harum reprehenderit autem iure quaerat facilis sequi eveniet neque? Praesentium expedita doloremque enim laborum.
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card elevation="2">
                      <v-card-title class="text-h5 py-2">
                        Frequently Asked Questions
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-card-text class="black--text body-1" style="overflow-y:auto;max-height:290px">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi delectus incidunt labore voluptatem vitae! Doloribus sint facilis accusantium, impedit consequuntur voluptatem numquam repellendus, illum sunt officiis hic et nam iure!
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container> -->

              <!-- <v-sheet elevation="2">
                <ManageStations></ManageStations>
              </v-sheet>

              <v-sheet elevation="2" class="mt-4">
                <ManageFiles></ManageFiles>
              </v-sheet> -->
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
// import ManageStations from '@/views/manage/Stations.vue'
// import ManageFiles from '@/views/manage/Files.vue'

export default {
  name: 'Manage',
  components: {
    // ManageStations,
    // ManageFiles
  }
}
</script>
