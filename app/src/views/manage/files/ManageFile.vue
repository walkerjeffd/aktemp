<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Manage Data File</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageFiles' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Files</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <v-card-text>
              <Alert type="error" title="Failed to Load File" class="ma-4" v-if="error">{{ error }}</Alert>
              <v-row v-else>
                <v-col cols="12" lg="4">
                  <ManageFileInfo :file="file" :loading="loading" :refreshing="refreshing" @refresh="fetch(true)"></ManageFileInfo>
                </v-col>
                <v-col cols="12" lg="8">
                  <Loading v-if="loading" class="pb-8"></Loading>
                  <Alert type="error" title="File Not Found" class="ma-4" v-else-if="!file">File was not found on server</Alert>
                  <div v-else>
                    <Alert type="error" title="File Created But Not Uploaded" v-if="file.status == 'CREATED'">File has been created in the database, but was not actually uploaded. This indicates a problem occurred with the upload form. Please delete this file and try again.</Alert>
                    <Alert type="warning" title="File Is Being Uploaded" v-else-if="file.status === 'UPLOADING'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
                    <Alert type="info" title="File Has Been Uploaded" v-else-if="file.status === 'UPLOADED'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
                    <Alert type="info" title="File Is Queued for Processing" v-else-if="file.status === 'QUEUED'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
                    <Alert type="warning" title="File Is Being Processed" v-else-if="file.status === 'PROCESSING'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
                    <Alert type="error" title="Failed To Process File" v-else-if="file.status === 'FAILED'">
                      <p>File was successfully uploaded, but failed to be processed. Please review the error below, fix the file, and try uploading again.</p>
                      <div class="font-weight-bold">{{ file.error || 'Unknown error'}}</div>
                    </Alert>
                    <SeriesTable :series="file.series" :selected="selectedSeries" @select="selectSeries" v-else></SeriesTable>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import ManageFileInfo from '@/views/manage/files/ManageFileInfo'
import SeriesTable from '@/components/SeriesTable'

export default {
  name: 'ManageFile',
  components: {
    ManageFileInfo,
    SeriesTable
  },
  data () {
    return {
      loading: true,
      refreshing: false,
      error: null,
      file: null,
      selectedSeries: null,
      timeout: null
    }
  },
  mounted () {
    this.fetch()
  },
  beforeDestroy () {
    this.clearTimeout()
  },
  methods: {
    clearTimeout () {
      this.timeout && clearTimeout(this.timeout)
    },
    async fetch (refresh) {
      this.clearTimeout()
      this.loading = !refresh
      this.refreshing = !!refresh
      this.error = null
      try {
        const response = await this.$http.restricted(`/files/${this.$route.params.fileId}`)
        this.file = response.data
        if (this.file && !['DONE', 'FAILED'].includes(this.file.status)) {
          this.timeout = setTimeout(() => {
            this.fetch(true)
          }, 3000)
        }
      } catch (err) {
        this.err = this.$errorMessage(err)
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    selectSeries (series) {
      this.$router.push({ name: 'manageSeriesOne', params: { seriesId: series.id, from: 'file' } })
    }
  }
}
</script>
