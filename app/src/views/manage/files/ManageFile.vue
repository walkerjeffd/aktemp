<template>
  <v-card elevation="2">
    <v-toolbar flat dense>
      <v-toolbar-title>
        <span class="text-h6">File: {{ file ? file.filename : 'Loading...' }}</span>
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
        <v-col cols="12" lg="4">
          <ManageFileInfo :file="file" :loading="loading" :refreshing="refreshing" @refresh="fetch(true)"></ManageFileInfo>
        </v-col>
        <v-col cols="12" lg="8">
          <Loading v-if="loading" class="pb-8"></Loading>
          <Alert type="error" title="File Not Found" class="ma-4" v-else-if="!file">File was not found on server</Alert>
          <div v-else>
            <Alert type="error" title="File Created But Not Uploaded" v-if="file.status == 'CREATED'">
              <p>A record of this file was saved to the database, but the file itself was not uploaded.</p>
              <p class="mb-0">
                This indicates a problem occurred during the upload process. Please delete this file and try again.
              </p>
            </Alert>
            <Alert type="warning" title="File Is Being Uploaded" v-else-if="file.status === 'UPLOADING'">
              <p>The file is currently being uploaded.</p>
              <p class="mb-0">
                If the status does not change in the next 15 minutes, please delete this file and try uploading it again.
              </p>
            </Alert>
            <Alert type="info" title="File Has Been Uploaded" v-else-if="file.status === 'UPLOADED'">
              <p>
                File has been uploaded to the server, but is not queued for loading into the database.
              </p>
              <p class="mb-0">
                If the status does not change in the next 15 minutes, please delete this file and try uploading it again.
              </p>
            </Alert>
            <Alert type="info" title="File Is Queued for Processing" v-else-if="file.status === 'QUEUED'">
              <p>
                File has been uploaded to the server and is waiting to be loaded into the database.
              </p>
              <p class="mb-0">
                Usually, a new file will be loaded within about 15 minutes. If the status does not change within an hour, please delete this file and try to upload it again.
              </p>
            </Alert>
            <Alert type="warning" title="File Is Being Processed" v-else-if="file.status === 'PROCESSING'">
              <p>
                File is currently being loaded into the database.
              </p>
              <p class="mb-0">
                This can take up to an hour. If the status does not change, please delete this file and try uploading it again.
              </p>
            </Alert>
            <Alert type="error" title="Failed To Process File" v-else-if="file.status === 'FAILED'">
              <p>File was successfully uploaded, but failed to be loaded into the database. Please review the error below, fix the file, and try uploading again.</p>
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
                  :columns="['id', 'station_code', 'start_datetime', 'end_datetime', 'depth_m', 'reviewed']"
                  @select="selectSeries"
                ></SeriesTable>

                <SelectedSeriesCard
                  v-if="series.selected"
                  :series="series.selected"
                  @close="selectSeries()"
                  @refresh="refreshSeries()"
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
                  @select="selectProfile"
                  v-else
                ></ProfilesTable>

                <SelectedProfileCard
                  v-if="profiles.selected"
                  :profile="profiles.selected"
                  @close="selectProfile()"
                  @refresh="refreshProfiles()"
                ></SelectedProfileCard>
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
import SelectedSeriesCard from '@/components/series/SelectedSeriesCard.vue'
import ProfilesTable from '@/components/profiles/ProfilesTable'
import SelectedProfileCard from '@/components/profiles/SelectedProfileCard.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageFile',
  components: {
    ManageFileInfo,
    SeriesTable,
    SelectedSeriesCard,
    ProfilesTable,
    SelectedProfileCard
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
      provider: 'manage/provider'
    })
  },
  watch: {
    provider () {
      if (!this.file || !this.provider) return
      if (this.file.provider_id !== this.provider.id) {
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
    async refreshSeries () {
      let id
      if (this.series.selected) {
        id = this.series.selected.id
      }
      this.selectSeries()
      await this.fetch()
      if (id) {
        const series = this.file.series.find(d => d.id === id)
        if (series) this.selectSeries(series)
      }
    },
    async refreshProfiles () {
      let id
      if (this.profiles.selected) {
        id = this.profiles.selected.id
      }
      this.selectProfile()
      await this.fetch()
      if (id) {
        const profile = this.file.profiles.find(d => d.id === id)
        if (profile) this.selectProfile(profile)
      }
    }
  }
}
</script>
