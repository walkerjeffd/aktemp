<template>
  <v-main>
    <v-container class="mt-4">
      <div class="text-h3 text-center mb-8">Welcome to AKTEMP</div>
      <v-img
        src="@/assets/img/stream-pano.png"
        alt="Panoramic photograph of a shallow stream in Alaska"
        class="my-8 elevation-4"
        style="border-radius: 15px;"
      ></v-img>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8" xl="6" class="black--text body-1">
          <p class="mb-8" style="font-size:1.1em">
            Welcome to the AKTEMP Water Temperature Database. This website is a portal for viewing, uploading, downloading, and managing stream and lake temperature data across Alaska. The database was created by <a href="https://walkerenvres.com" target="_blank">Walker Environment Research</a> in partnership with the <a href="https://accs.uaa.alaska.edu/" target="_blank">Alaska Center for Conservation Science (ACCS)</a> at the University of Alaska Anchorage and was funded through a grant from the U.S. Environmental Protection Agency.
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
          <Alert prominent v-if="$vuetify.breakpoint.mdAndDown" type="error" title="Not Optimized for Mobile Devices">
            AKTEMP is not optimized for mobile devices. Please use a desktop or laptop computer to access the database.
          </Alert>
          <v-divider class="my-4"></v-divider>
          <p>
            <strong>Need Help Getting Started?</strong> Information on how to use the database to upload, review, search, or download data can be found in the <a href="https://accscatalog.uaa.alaska.edu/dataset/aktemp-water-temperature-database">User Guide</a>.
          </p>
          <p>
            <strong>Interested in Contributing Your Data?</strong> User accounts are required to upload and manage data in the database. Please <router-link :to="{ name: 'request' }">request an account</router-link> if you have data that you would like to contribute.
          </p>
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
  name: 'Home'
}
</script>
