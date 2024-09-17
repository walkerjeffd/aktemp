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
            Welcome to the AKTEMP Water Temperature Database. This website is a portal for viewing, uploading, downloading, and managing stream and lake temperature data across Alaska. The database was created by <a href="https://walkerenvres.com" target="_blank">Walker Environment Research</a> in collaboration with the <a href="https://accs.uaa.alaska.edu/" target="_blank">Alaska Center for Conservation Science (ACCS)</a> at the University of Alaska Anchorage and the <a href="https://www.usgs.gov/centers/eesc" target="_blank">U.S. Geological Survey (USGS) Eastern Ecological Science Center</a>. AKTEMP was funded by a grant from the U.S. Environmental Protection Agency.
          </p>
          <div class="d-flex justify-space-around mb-8">
            <v-btn
              color="primary"
              x-large
              :to="{ name: 'explorer' }"
            >
              <v-icon left>mdi-chart-line</v-icon>
              Data Explorer
            </v-btn>
            <v-btn
              color="primary"
              x-large
              href="https://accscatalog.uaa.alaska.edu/dataset/aktemp-water-temperature-database"
              target="_blank"
            >
              <v-icon left>mdi-book-outline</v-icon>
              User Guide
            </v-btn>
          </div>
          <v-divider class="my-4"></v-divider>
          <p>
            <strong>Need Help Getting Started?</strong> Information on how to use the database to upload, review, search, or download data can be found in the <a href="https://accscatalog.uaa.alaska.edu/dataset/aktemp-water-temperature-database">User Guide</a>.
          </p>
          <p>
            <strong>Interested in Contributing Your Data?</strong> User accounts are required to upload and manage data in the database. Please <router-link :to="{ name: 'request' }">request an account</router-link> if you have data that you would like to contribute.
          </p>
          <p>
            <strong>How to cite this database?</strong> If you are using data from AKTEMP in a report or publication, please use the following recommended citation. Be sure to include a list of the specific providers for the data you are using as a way of acknowledging their contributions.
          </p>
          <blockquote class="blockquote text-body-1 my-4 py-0">
            Alaska Water Temperature Database (AKTEMP) ({{ (new Date()).getFullYear() }}). Water temperature data collected by [provider 1], [provider 2], etc. Retrieved from https://aktemp.uaa.alaska.edu on [date].
          </blockquote>
          <p>
            <strong>Questions?</strong> Please contact <a href="mailto:uaa_aktemp@alaska.edu">uaa_aktemp@alaska.edu</a> for support.
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
