<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Upload Data File</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageFiles' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Files</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>
            <p>Upload file form</p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
export default {
  name: 'ManageFileUpload'
}
</script>

<style>

</style>
