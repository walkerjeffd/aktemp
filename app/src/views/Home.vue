<template>
  <v-main>
    <v-container class="mt-4">
      <Alert prominent v-if="$vuetify.breakpoint.mdAndDown" type="error" title="Not Optimized for Mobile Devices">
        AKTEMP is not optimized for mobile devices. Please use a desktop or laptop computer to access the database.
      </Alert>

      <v-parallax dark src="@/assets/img/stream-pano.jpg" style="border-radius: 15px;" class="mb-8 align-start aktemp-parallax">
        <div class="mx-n4 pt-4 px-8 text-center" style="background:rgba(0,0,0,0.5)">
          <h1 class="display-2 font-weight-thin mb-4">Welcome to AKTEMP</h1>
        </div>
        <v-fade-transition>
          <v-row align="end" justify="start" v-if="stats">
            <v-col cols="12">
              <div class="ml-n4 aktemp-db-stats">
                <div class="text-h6 font-weight-light">Database Summary</div>
                <v-list color="transparent" dark dense>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-account-group</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content class="text-h6 font-weight-normal">
                      {{ stats.providers.toLocaleString() }} Data Providers
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-map-marker-multiple</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content class="text-h6 font-weight-normal">
                      {{ stats.stations.toLocaleString() }} Stations
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-thermometer-low</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content class="text-h6 font-weight-normal">
                      {{ stats.values.toLocaleString() }} Measurements
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>
          </v-row>
        </v-fade-transition>
      </v-parallax>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8" xl="6" class="black--text body-1">
          <p class="mb-8" style="font-size:1.1em">
            Welcome to the AKTEMP Water Temperature Database. This website is a portal for viewing, uploading, downloading, and managing stream and lake temperature data across Alaska. The database was created by <a href="https://walkerenvres.com" target="_blank">Walker Environment Research</a> in collaboration with the <a href="https://accs.uaa.alaska.edu/" target="_blank">Alaska Center for Conservation Science (ACCS)</a> at the University of Alaska Anchorage and the <a href="https://www.usgs.gov/centers/eesc" target="_blank">U.S. Geological Survey (USGS) Eastern Ecological Science Center</a>.
          </p>
          <v-row class="mb-8">
            <v-col cols="12" md="6">
              <v-card
                href="https://aktemp.uaa.alaska.edu/viz"
                hover
                height="100%"
                aria-label="Data Visualization"
              >
                <v-img
                  src="@/assets/img/data-viz-screenshot.jpg"
                  height="200"
                  class="grey lighten-2"
                >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
                <v-card-text class="text-center pa-4">
                  <h2 class="text-h4 mb-4 black--text">Data Viz Tool</h2>
                  <p class="text-body-1 mb-0 black--text">
                    Use interactive data vizualizations to explore stream temperature patterns and dynamics with data from AKTEMP, NPS, and USGS
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card
                :to="{ name: 'explorer' }"
                hover
                height="100%"
                aria-label="Database Explorer"
              >
                <v-img
                  src="@/assets/img/database-screenshot.jpg"
                  height="200"
                  class="grey lighten-2"
                >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
                <v-card-text class="text-center pa-4">
                  <h2 class="text-h4 mb-4 black--text">Database Explorer</h2>
                  <p class="text-body-1 mb-0 black--text">
                    Search, filter, download, and explore water temperature data from stations in the AKTEMP database
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-divider class="my-8"></v-divider>
          <p>
            <strong>Need Help Getting Started?</strong> Information on how to use the database to upload, review, search, or download data can be found in the <a href="https://accscatalog.uaa.alaska.edu/dataset/aktemp-water-temperature-database">User Guide</a>.
          </p>
          <p>
            <strong>Interested in Contributing Your Data?</strong> User accounts are required to upload and manage data in the database. Please <router-link :to="{ name: 'request' }">request an account</router-link> if you have data that you would like to contribute.
          </p>
          <p>
            <strong>How to cite this database?</strong> If you are using data from AKTEMP in a report or publication, please use the following recommended citation. Be sure to acknowledge the contributions of the specific providers for the data you are using by listing them in the citation.
          </p>
          <blockquote class="blockquote text-body-1 my-4 py-0">
            Alaska Water Temperature Database (AKTEMP) ({{ (new Date()).getFullYear() }}). Water temperature data collected by [provider 1], [provider 2], etc. Retrieved from https://aktemp.uaa.alaska.edu on [date].
          </blockquote>
          <p>
            <strong>Questions?</strong> Please contact <a href="mailto:uaa_aktemp@alaska.edu">uaa_aktemp@alaska.edu</a> for support.
          </p>
          <p>
            <strong>Funding:</strong> AKTEMP was funded by grants from the <a href="https://www.epa.gov/exchangenetwork/exchange-network-grant-program" target="_blank">U.S. Environmental Protection Agency (USEPA) Exchange Network</a> and the <a href="https://akcasc.org/" target="_blank">Alaska Climate Adaptation Science Center (AKCASC)</a>.
          </p>
          <p>
            <strong>Disclaimer:</strong> The database allows users to choose whether their data should be publically available. All public datasets can be downloaded through the Data Explorer. ACCS makes no guarantees about the accuracy or reliability of the data submitted to AKTEMP. Data downloaded from AKTEMP should be reviewed by the user prior to visualization, summary, or analysis.
          </p>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>

export default {
  name: 'Home',
  data: () => ({
    stats: null,
    showTitle: false
  }),
  mounted: function () {
    this.fetchStats()
  },
  methods: {
    async fetchStats () {
      try {
        this.stats = await this.$http.public.get('/stats')
          .then(response => response.data)
      } catch (err) {
        console.error(err)
      }
    }
  }
}
</script>

<style>
.aktemp-db-stats {
  display:inline-block;
  background: linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0.5), rgba(0,0,0,0));
  padding: 10px 100px 10px 10px;
}
.aktemp-parallax > .v-parallax__content {
  justify-content: start !important;
}
</style>
