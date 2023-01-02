<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="600"
    @keydown.esc="close"
    style="z-index:2000"
  >
    <v-card>
      <v-toolbar flat dense color="grey lighten-2">
        <v-toolbar-title class="text-h6">
          Edit User
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="close"><v-icon small>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 mb-0 black--text">
        <Loading v-if="loading.user" class="pb-8"></Loading>

        <div v-else-if="user">
          <v-simple-table>
            <tbody>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  ID
                </td>
                <td class="font-weight-bold">{{ user.id }}</td>
              </tr>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  Created
                </td>
                <td class="font-weight-bold">{{ user.created_at | timestamp('ff', 'local') }}</td>
              </tr>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  Updated
                </td>
                <td class="font-weight-bold">{{ user.updated_at | timestamp('ff', 'local') }}</td>
              </tr>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  Name
                </td>
                <td class="font-weight-bold">
                  {{ user.attributes.name }}
                </td>
              </tr>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  Email
                </td>
                <td class="font-weight-bold">
                  {{ user.attributes.email }}
                </td>
              </tr>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  Enabled
                </td>
                <td class="font-weight-bold">
                  <Checkbox :value="user.enabled"></Checkbox>
                </td>
              </tr>
              <tr>
                <td
                  class="text-right"
                  style="width:140px">
                  Status
                </td>
                <td class="font-weight-bold">
                  <v-chip small label
                    :color="user.status==='CONFIRMED' ? 'gray' : 'warning'"
                  >
                    {{ user.status }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-simple-table>

          <v-divider class="mb-4"></v-divider>

          <v-form ref="form" @submit.prevent="submit" class="px-4 pb-4">
            <v-checkbox
              v-model="edit.admin"
              label="Administrator"
              @change="modified = true"
            ></v-checkbox>

            <v-autocomplete
              v-if="dialog"
              v-model="edit.providers"
              :items="providersOptions"
              item-text="code"
              item-value="id"
              label="Select provider(s)"
              multiple
              chips
              deletable-chips
              outlined
              required
              hide-details
              clearable
              @input="modified = true"
            >
              <template v-slot:item="{ item }">
                <v-list-item-icon><v-simple-checkbox :value="edit.providers && edit.providers.includes(item.id)"></v-simple-checkbox></v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title v-html="item.code"></v-list-item-title>
                  <v-list-item-subtitle v-html="item.name"></v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </v-autocomplete>

            <v-divider class="my-4 mx-n4 pr-0"></v-divider>

            <div class="d-flex justify-space-between mt-4">
              <v-btn
                v-if="!user.enabled"
                color="success"
                outlined
                :loading="loading.enabled"
                class="mr-4"
                @click="setEnabled(true)"
              >
                <v-icon left>mdi-check</v-icon> Enable User
              </v-btn>
              <v-btn
                v-else
                color="warning"
                outlined
                :loading="loading.enabled"
                class="mr-4"
                @click="setEnabled(false)"
              >
                <v-icon left>mdi-close</v-icon> Disable User
              </v-btn>
              <v-btn
                color="error"
                outlined
                @click="confirmDelete"
                :loading="loading.delete"
              >
                <v-icon left>mdi-delete</v-icon>
                Delete User
              </v-btn>
            </div>

            <v-btn type="submit" class="hidden">submit</v-btn>
          </v-form>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <Alert v-if="error" type="error" title="Server Error" class="mx-4 mt-4 mb-0">
        {{ error }}
      </Alert>

      <v-card-actions class="px-4 py-4">
        <v-btn
          color="primary"
          :disabled="!modified || this.loading.update"
          @click.native="submit"
        >save changes</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click.native="close"
        >close</v-btn>
      </v-card-actions>
    </v-card>

    <ConfirmDialog ref="confirmDelete">
      <Alert type="error" title="Are you sure?">
        <p>
          This user will be permanently deleted. This action cannot be undone.
        </p>
        <p class="mb-0">
          <strong>NOTE:</strong> Any data uploaded by this user will <strong>not be deleted</strong>. The data will remain under the associated provider. Delete the provider to delete all of its data.
        </p>
      </Alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import ConfirmDialog from '@/components/ConfirmDialog'
import evt from '@/events'
import { getUser } from '@/lib/auth'

export default {
  name: 'AdminEditUserDialog',
  components: { ConfirmDialog },
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,

      id: null,
      user: null,
      edit: {
        admin: false,
        providers: []
      },

      modified: false,
      error: false,

      loading: {
        user: false,
        enabled: false,
        admin: false,
        delete: false,
        update: false
      }
    }
  },
  computed: {
    ...mapGetters({ providersOptions: 'admin/providers' })
  },
  methods: {
    open (id) {
      this.dialog = true
      this.id = id
      this.modified = false
      this.user = null

      this.edit.admin = false
      this.edit.providers = []

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
      this.loading.user = true

      try {
        await this.refresh()
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading.user = false
      }
    },
    async refresh () {
      this.error = null

      if (!this.id) {
        this.error = 'Missing user ID'
        return
      }

      this.user = await this.getUser(this.id)

      this.loading.delete = false
      this.loading.enabled = false
      this.loading.admin = false
    },
    async getUser (id) {
      const response = await this.$http.admin.get(`/users/${id}`)
      const user = response.data

      user.attributes.email_verified = user.attributes.email_verified === 'true'

      this.edit.admin = user.admin
      this.edit.providers = user.providers

      return user
    },
    async setAdminGroup (value) {
      this.loading.update = true
      const action = value ? 'addToAdmin' : 'removeFromAdmin'
      await this.$http.admin.put(`/users/${this.id}`, { action })
    },
    async setEnabled (value) {
      this.loading.enabled = true
      const action = value ? 'enable' : 'disable'
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action })
        evt.$emit('notify', `User (${this.user.attributes.email}) has been ${action}d`, 'success')
        this.resolve(true)
        this.close()
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading.enabled = false
      }
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteUser()
      }
    },
    async deleteUser () {
      this.loading.delete = true
      try {
        await this.$http.admin.delete(`/users/${this.id}`)
        evt.$emit('notify', `User (${this.user.attributes.email}) has been deleted`, 'success')
        this.resolve(true)
        this.close()
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading.delete = false
      }
    },
    async submit () {
      this.loading.update = true

      try {
        if (this.edit.admin !== this.user.admin) {
          await this.setAdminGroup(this.edit.admin)
        }

        await this.$http.admin.put(`/users/${this.id}`, {
          action: 'setProviders',
          providerIds: this.edit.providers
        })

        evt.$emit('notify', `User (${this.user.attributes.email}) has been updated`, 'success')
        getUser()
        this.resolve(true)
        this.close()
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading.update = false
      }
    }
  },
  close () {
    this.dialog = false
  }
}
</script>
