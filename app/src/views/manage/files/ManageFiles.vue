<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Failed to Load Files" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
    <v-data-table
      :headers="headers"
      :items="files"
      :loading="status.loading"
      :sort-by="['created_at']"
      :sort-desc="[true]"
      @click:row="select"
      loading-text="Loading... Please wait"
      class="row-cursor-pointer elevation-2"
      v-else
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h6">Data Files</v-toolbar-title>
          <RefreshButton @click="fetch"></RefreshButton>
          <v-spacer></v-spacer>
          <v-btn color="success" :to="{ name: 'manageFileForm' }" class="mr-2">
            <v-icon left>mdi-upload</v-icon> Upload File
          </v-btn>
          <v-btn color="success" class="ml-2" :to="{ name: 'manageFilesBatch' }">
            <v-icon left>mdi-file-multiple-outline</v-icon> Batch Upload
          </v-btn>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to view or delete data from each file
        </div>
        <v-divider></v-divider>
      </template>
      <template v-slot:item.filename="{ item }">
        {{ item.filename | truncate(80) }}
      </template>
      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | formatTimestamp('lll') }}
      </template>
      <template v-slot:item.status="{ item }">
        <StatusChip :status="item.status"></StatusChip>
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
      search: '',
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left',
          width: '80px'
        },
        {
          text: 'Uploaded',
          value: 'created_at',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Filename',
          value: 'filename',
          align: 'left'
        },
        {
          text: 'Type',
          value: 'type',
          align: 'left'
        },
        {
          text: 'Status',
          value: 'status',
          align: 'left',
          width: '120px'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization',
      files: 'manage/files',
      status: 'manage/filesStatus'
    })
  },
  watch: {
    organization () {
      this.fetch()
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.$store.dispatch('manage/fetchFiles')
    },
    select (file) {
      this.$router.push({ name: 'manageFile', params: { fileId: file.id } })
    }
  }
}
</script>
