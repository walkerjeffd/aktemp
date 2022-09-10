<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="800"
    @keydown.esc="close"
  >
    <v-card style="width:600px">
      <v-toolbar flat color="grey lighten-2">
        <v-toolbar-title class="text-h5">
          Edit User
        </v-toolbar-title>
      </v-toolbar>
      <Loading v-if="loading.user" class="pb-8"></Loading>
      <v-form ref="form" @submit.prevent="submit" v-else-if="user">
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
              <td class="font-weight-bold">{{ user.created_at | timestampFormat('lll') }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Updated
              </td>
              <td class="font-weight-bold">{{ user.updated_at | timestampFormat('lll') }}</td>
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
                <v-icon v-if="user.enabled" color="primary">mdi-check-circle</v-icon>
                <v-icon v-else color="gray">mdi-close-circle</v-icon>
              </td>
            </tr>
            <!-- <tr>
              <td
                class="text-right"
                style="width:140px">
                Admin
              </td>
              <td class="font-weight-bold">
                <v-icon v-if="user.admin" color="primary">mdi-check-circle</v-icon>
                <v-icon v-else color="gray">mdi-close-circle</v-icon>
              </td>
            </tr> -->
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Status
              </td>
              <td class="font-weight-bold">
                <div class="d-flex align-center">
                  <v-chip
                    v-if="user.status==='CONFIRMED'"
                    small
                    label
                    color="gray"
                  >
                    {{ user.status }}
                  </v-chip>
                  <v-chip
                    v-else
                    small
                    label
                    color="warning"
                  >
                    {{ user.status }}
                  </v-chip>
                  <v-spacer></v-spacer>
                </div>
              </td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-divider class="mb-4"></v-divider>

        <v-card-text class="">
          <v-select
            v-model="edit.organizations"
            :items="organizationsOptions"
            label="Select organization(s)"
            multiple
            chips
            deletable-chips
            item-text="name"
            item-value="id"
            outlined
            required
            :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
            @input="modified = true"
          ></v-select>
          <v-switch
            v-model="edit.admin"
            label="Administrator"
            @change="modified = true"
          ></v-switch>
        </v-card-text>

        <v-divider class="mb-0"></v-divider>

        <v-card-text>
          <v-btn
            v-if="!user.enabled"
            color="success"
            block
            outlined
            :loading="loading.enabled"
            @click="setEnabled(true)"
          >
            <v-icon left>mdi-check</v-icon> Enable User
          </v-btn>
          <v-btn
            v-else
            color="warning"
            block
            outlined
            :loading="loading.enabled"
            @click="setEnabled(false)"
          >
            <v-icon left>mdi-close</v-icon> Disable User
          </v-btn>

          <div class="my-4"></div>

          <v-btn
            color="error"
            outlined
            block
            @click="confirmDelete"
            :loading="loading.delete"
          >
            <v-icon left>mdi-delete</v-icon>
            Delete User
          </v-btn>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-4 py-4">
          <v-btn
            color="primary"
            :disabled="!modified || this.loading.update"
            @click.native="submit"
          >save</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click.native="close"
          >close</v-btn>
        </v-card-actions>
      </v-form>

    </v-card>

    <ConfirmDialog ref="confirmDelete">
      <Alert type="error" title="Are you sure?">
        This user will be permanently deleted. This action cannot be undone.
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
  name: 'AdminUserEditDialog',
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
        organizations: []
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
    ...mapGetters({ organizationsOptions: 'admin/organizations' })
  },
  methods: {
    open (id) {
      this.dialog = true
      this.id = id
      this.modified = false
      this.user = null
      this.edit.admin = false
      this.edit.organizations = []

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
      this.edit.organizations = user.organizations

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
        this.refresh()
        evt.$emit('notify', `User has been ${action}d`, 'success')
      } catch (err) {
        console.error(err)
        this.loading.enabled = false
        this.err = this.$errorMessage(err)
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
        evt.$emit('notify', 'User has been deleted', 'success')
        this.resolve(true)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.err = this.$errorMessage(err)
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
          action: 'setOrganizations',
          organizationIds: this.edit.organizations
        })

        evt.$emit('notify', 'User has been updated', 'success')
        getUser()
        this.resolve(true)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.loading.update = false
        this.err = this.$errorMessage(err)
      } finally {
        this.loading.update = false
      }
    }
  }
}
</script>
