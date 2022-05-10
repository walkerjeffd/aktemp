<template>
  <v-sheet elevation="2">
    <v-toolbar flat>
      <v-toolbar-title class="text-h6">File Info </v-toolbar-title>
      <v-spacer></v-spacer><RefreshButton :loading="refreshing" @click="$emit('refresh')"></RefreshButton>
    </v-toolbar>
    <v-divider></v-divider>
    <Loading v-if="loading" class="pb-8"></Loading>
    <div v-else>
      <v-simple-table dense>
        <tbody>
          <tr>
            <td class="text-right grey--text text--darken-2" style="width:100px">
              ID
            </td>
            <td class="font-weight-bold">{{ file.id }}</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Organization
            </td>
            <td class="font-weight-bold">{{ file.organization_code }}</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Filename
            </td>
            <td class="font-weight-bold">{{ file.filename | truncate(30) }}</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Type
            </td>
            <td class="font-weight-bold">Series</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Uploaded
            </td>
            <td class="font-weight-bold">{{ file.created_at | timestampFormat('lll') }}</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Status
            </td>
            <td class="font-weight-bold"><StatusChip :status="file.status"></StatusChip></td>
          </tr>
        </tbody>
      </v-simple-table>

      <v-divider class="mb-4"></v-divider>

      <div class="mx-4 pb-2">
        <div class="my-4">
          <v-btn color="primary" outlined block :disabled="!file.url" :href="file.url" download>
            <v-icon left>mdi-download</v-icon>Download File
          </v-btn>
          <v-btn color="primary" outlined block @click="processFile" class="my-4">
            <v-icon left>mdi-refresh</v-icon>Process File
          </v-btn>
          <v-btn
            color="error"
            outlined
            block
            class="mt-4"
            @click="confirmDelete"
            :loading="deleteStatus.loading"
          >
            <v-icon left>mdi-delete</v-icon>
            Delete File
          </v-btn>
        </div>
        <Alert type="error" title="Error Occurred" v-if="deleteStatus.error">{{ deleteStatus.error }}</Alert>
      </div>
    </div>

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
          This file and all its data will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-sheet>
</template>

<script>
import evt from '@/events'

export default {
  name: 'ManageFileInfo',
  props: ['loading', 'refreshing', 'file'],
  data () {
    return {
      deleteStatus: {
        loading: false,
        error: null
      }
    }
  },
  methods: {
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteFile()
      }
    },
    async processFile (file) {
      await this.$http.restricted.post(
        `/files/${this.file.id}/process`,
        null
      )
      this.$emit('refresh')
    },
    async deleteFile () {
      this.deleteStatus.loading = true
      this.deleteStatus.error = null
      try {
        await this.$http.restricted.delete(`/files/${this.file.id}`)
        evt.$emit('notify', 'File has been deleted', 'success')
        this.$router.push({ name: 'manageFiles' })
      } catch (err) {
        console.error(err)
        this.deleteStatus.error = err.toString() || 'Unknown error'
      } finally {
        this.deleteStatus.loading = false
      }
    }
  }
}
</script>

<style>

</style>
