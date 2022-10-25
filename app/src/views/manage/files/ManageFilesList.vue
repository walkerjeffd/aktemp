<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Failed to Load Files" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="files"
      :search="search"
      :loading="status.loading || deleting"
      :sort-by.sync="sort.by"
      :sort-desc.sync="sort.desc"
      @click:row="select"
      loading-text="Loading... Please wait"
      class="row-cursor-pointer elevation-2"
      show-select
      v-else
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h6">Files</v-toolbar-title>
          <v-divider inset vertical class="mx-4"></v-divider>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search files"
            single-line
            hide-details
            clearable
            dense
          ></v-text-field>

          <v-spacer></v-spacer>
          <v-btn color="success" :to="{ name: 'manageFileForm' }" class="mr-2">
            <v-icon left>mdi-upload</v-icon> Upload File
          </v-btn>
          <v-btn color="success" class="ml-2" :to="{ name: 'manageFilesBatch' }">
            <v-icon left>mdi-file-multiple-outline</v-icon> Batch Upload
          </v-btn>
          <v-divider inset vertical class="ml-4"></v-divider>
          <RefreshButton @click="fetch"></RefreshButton>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to view and manage a file
        </div>
        <v-divider></v-divider>
      </template>
      <template v-slot:item.filename="{ item }">
        {{ item.filename | truncate(80) }}
      </template>
      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestamp('ff', 'local') }}
      </template>
      <template v-slot:item.status="{ item }">
        <StatusChip :status="item.status"></StatusChip>
      </template>
      <template v-slot:footer.prepend>
        <v-btn
          outlined
          color="error"
          :disabled="selected.length === 0"
          :loading="deleting"
          @click="confirmDelete"
        >
          <v-icon left>mdi-delete</v-icon>
          Delete Selected ({{selected.length}})
        </v-btn>
      </template>
    </v-data-table>
    <ConfirmDialog ref="confirmDelete">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          These files and all of their data will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import evt from '@/events'

export default {
  name: 'ManageFilesList',
  data () {
    return {
      deleting: false,
      search: '',
      sort: {
        by: ['created_at'],
        desc: [true]
      },
      selected: [],
      headers: [
        {
          text: 'ID',
          value: 'id',
          width: '80px'
        },
        {
          text: 'Uploaded',
          value: 'created_at',
          width: '200px'
        },
        {
          text: 'Filename',
          value: 'filename'
        },
        {
          text: 'Type',
          value: 'type'
        },
        {
          text: 'Status',
          value: 'status',
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
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteFiles()
      }
    },
    async deleteFiles () {
      const files = this.selected.slice()
      this.deleting = true
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          await this.$http.restricted.delete(`/files/${file.id}`)
          this.$store.dispatch('manage/removeFileById', file.id)
          this.unselectById(file.id)
        } catch (err) {
          console.error(err)
          this.error = this.$errorMessage(err)
          this.deleting = false
          return
        }
      }
      this.fetch()
      evt.$emit('notify', 'Selected files have been deleted', 'success')
      this.deleting = false
    },
    unselectById (id) {
      this.selected = this.selected.filter(d => d.id !== id)
    }
  }
}
</script>
