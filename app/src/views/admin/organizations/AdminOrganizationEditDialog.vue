<template>
  <v-dialog
    v-model="dialog"
    scrollable
    @keydown.esc="close"
  >
    <v-card style="width:600px">
      <v-toolbar flat color="grey lighten-2">
        <v-toolbar-title class="text-h5">
          Edit Organization
        </v-toolbar-title>
      </v-toolbar>

      <div v-if="loading.init" class="text-h5 text-center py-8">
        Loading...
      </div>

      <div v-if="organization">
        <v-simple-table>
          <tbody>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                ID
              </td>
              <td class="font-weight-bold">{{ organization.id }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Code
              </td>
              <td class="font-weight-bold">{{ organization.code }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Name
              </td>
              <td class="font-weight-bold">{{ organization.name }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Created
              </td>
              <td class="font-weight-bold">{{ organization.created_at | timestampFormat('lll') }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Updated
              </td>
              <td class="font-weight-bold">{{ organization.updated_at | timestampFormat('lll') }}</td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-divider></v-divider>

        <v-card-text>
          <v-btn
            color="error"
            outlined
            block
            @click="confirmDelete"
            :loading="loading.delete"
          >
            <v-icon left>mdi-delete</v-icon>
            Delete Organization
          </v-btn>
        </v-card-text>
      </div>

      <v-divider></v-divider>

      <v-card-actions class="px-4 py-4">
        <v-spacer></v-spacer>
        <v-btn
          text
          @click.native="close"
        >close</v-btn>
      </v-card-actions>
    </v-card>

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
          This user will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import ConfirmDialog from '@/components/ConfirmDialog'
export default {
  name: 'AdminOrganizationEditDialog',
  components: { ConfirmDialog },
  data () {
    return {
      tab: 0,
      dialog: false,
      resolve: null,
      reject: null,
      organization: null,
      id: null,
      loading: {
        init: false,
        // confirm: false,
        enabled: false,
        admin: false,
        delete: false
      },
      modified: false,
      error: null
    }
  },
  methods: {
    async open (id) {
      this.dialog = true
      this.id = id
      this.modified = false

      this.init()

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    close () {
      this.resolve(this.modified)
      this.dialog = false
    },
    async init () {
      this.loading.init = true

      try {
        await this.refresh()
      } catch (err) {
        console.log(err)
        this.error = err
      } finally {
        this.loading.init = false
      }
    },
    async refresh () {
      this.error = null

      if (!this.id) {
        this.error = 'Missing User ID'
        return
      }

      this.organization = await this.getOrganization(this.id)

      this.loading.enabled = false
      this.loading.admin = false
    },
    async getOrganization (id) {
      const response = await this.$http.admin.get(`/organizations/${id}`)
      const user = response.data
      return user
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteOrganization()
      }
    },
    async deleteOrganization () {
      this.loading.delete = true
      try {
        await this.$http.admin.delete(`/organizations/${this.id}`)
        this.resolve(true)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.delete = false
      }
    }
  }
}
</script>
