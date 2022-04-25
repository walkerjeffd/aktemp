<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="files"
      :loading="loading"
      @click:row="clickRow"
      loading-text="Loading... Please wait"
      class="row-cursor-pointer">
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h5"><v-icon>mdi-file-multiple-outline</v-icon> Files</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="upload" disabled>
            <v-icon left>mdi-upload</v-icon> Upload File
          </v-btn>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to view file details
        </div>
        <v-divider></v-divider>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageFiles',
  data () {
    return {
      loading: true,
      files: [],
      error: null,
      search: '',
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left'
        },
        {
          text: 'Organization',
          value: 'organization_id',
          align: 'left'
        },
        {
          text: 'Filename',
          value: 'filename',
          align: 'left'
        },
        {
          text: 'Uploaded',
          value: 'created_at',
          align: 'left'
        },
        {
          text: 'Status',
          value: 'status',
          align: 'left'
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.restricted.get('/files')
        this.files = response.data
      } catch (err) {
        this.error = err.toString()
      } finally {
        this.loading = false
      }
    },
    async upload () {
      console.log('files')
      // const station = await this.$refs.stationForm.open()
      // if (station) {
      //   await this.fetch()
      // }
    },
    clickRow (file) {
      this.$router.push({ name: 'manageFile', params: { fileId: file.id } })
    }
  }
}
</script>
