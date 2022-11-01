<template>
  <v-card elevation="2">
    <v-toolbar flat dense>
      <v-toolbar-title>
        <span class="text-h6">{{ file ? file.filename : '' }}</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small @click="$router.push({ name: 'manageFiles' })">
        <v-icon small left>mdi-chevron-left</v-icon> Back to Files
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>

    <v-card-text>
      <Alert type="error" title="Failed to Load File" class="ma-4" v-if="error">{{ error }}</Alert>
      <v-row v-else>
        <v-col cols="12" lg="4" xl="3">
          <ManageFileInfo :file="file" :loading="loading" :refreshing="refreshing" @refresh="fetch(true)"></ManageFileInfo>
        </v-col>
        <v-col cols="12" lg="8" xl="9">
          <Loading v-if="loading" class="pb-8"></Loading>
          <Alert type="error" title="File Not Found" class="ma-4" v-else-if="!file">File was not found on server</Alert>
          <div v-else>
            <Alert type="error" title="File Created But Not Uploaded" v-if="file.status == 'CREATED'">File has been created in the database, but was not actually uploaded. This indicates a problem occurred with the upload form. Please delete this file and try again.</Alert>
            <Alert type="warning" title="File Is Being Uploaded" v-else-if="file.status === 'UPLOADING'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
            <Alert type="info" title="File Has Been Uploaded" v-else-if="file.status === 'UPLOADED'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
            <Alert type="info" title="File Is Queued for Processing" v-else-if="file.status === 'QUEUED'">If the status does not change within an hour, please delete this file and try to upload it again. It is safe to close the browser or navigate to another page, and then check back later.</Alert>
            <Alert type="warning" title="File Is Being Processed" v-else-if="file.status === 'PROCESSING'">If the status does not change in the next few minutes, please delete this file and try to upload it again.</Alert>
            <Alert type="error" title="Failed To Process File" v-else-if="file.status === 'FAILED'">
              <p>File was successfully uploaded, but failed to be processed. Please review the error below, fix the file, and try uploading again.</p>
              <div class="font-weight-bold">{{ file.error || 'Unknown error'}}</div>
            </Alert>
            <div v-else>
              <v-sheet v-if="file.type === 'SERIES'">
                <Alert
                  v-if="series.error"
                  type="error"
                  title="Failed to Get Timeseries"
                  class="elevation-2"
                >{{ series.error }}</Alert>

                <SeriesTable
                  v-else
                  :series="file.series"
                  :selected="series.selected"
                  :columns="['id', 'start_datetime', 'end_datetime', 'reviewed']"
                  @select="selectSeries"
                ></SeriesTable>

                <SelectedSeriesCard
                  v-if="series.selected"
                  :series="series.selected"
                  @close="selectSeries()"
                  @delete="onDeleteSeries()"
                ></SelectedSeriesCard>
              </v-sheet>
              <v-sheet v-if="file.type === 'PROFILES'">
                <Alert
                  v-if="profiles.error"
                  type="error"
                  title="Failed to Get Vertical Profiles"
                  class="elevation-2"
                >{{ profiles.error }}</Alert>
                <ProfilesTable
                  :profiles="file.profiles"
                  :selected="profiles.selected"
                  :columns="['id', 'date']"
                  @select="selectProfile"
                  v-else
                ></ProfilesTable>

                <Alert type="error" title="Not Implemented">Profiles chart not yet implemented</Alert>
              </v-sheet>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import ManageFileInfo from '@/views/manage/files/ManageFileInfo'
import SeriesTable from '@/components/series/SeriesTable'
import ProfilesTable from '@/components/ProfilesTable'
import SelectedSeriesCard from '@/components/series/SelectedSeriesCard.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageFile',
  components: {
    ManageFileInfo,
    SeriesTable,
    SelectedSeriesCard,
    ProfilesTable
  },
  data () {
    return {
      loading: true,
      refreshing: false,
      error: null,
      file: null,
      series: {
        loading: true,
        error: false,
        selected: null
      },
      profiles: {
        loading: true,
        error: false,
        selected: null
      },
      timeout: null
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization'
    })
  },
  watch: {
    organization () {
      if (!this.file || !this.organization) return
      if (this.file.organization_id !== this.organization.id) {
        this.$router.push({
          name: 'manageFiles'
        })
      }
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
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    selectSeries (series) {
      if (!series) {
        this.series.selected = null
      } else if (this.series.selected === series) {
        this.series.selected = null
      } else {
        this.series.selected = series
      }
    },
    selectProfile (profile) {
      if (!profile) {
        this.profiles.selected = null
      } else if (this.profiles.selected === profile) {
        this.profiles.selected = null
      } else {
        this.profiles.selected = profile
      }
    },
    onDeleteSeries () {
      this.selectSeries()
      this.fetch()
    }
  }
}
</script>
