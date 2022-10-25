<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="600"
    @keydown.esc="cancel"
    style="z-index:2000"
  >
    <v-card>
      <v-toolbar flat dense color="grey lighten-2">
        <v-toolbar-title class="text-h6">
          <span v-if="!organization">Create Organization</span>
          <span v-else>Edit Organization</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="cancel"><v-icon small>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 mb-0 black--text">
        <v-simple-table v-if="organization">
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
                Created
              </td>
              <td class="font-weight-bold">{{ organization.created_at | timestamp('ff', 'local') }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Updated
              </td>
              <td class="font-weight-bold">{{ organization.updated_at | timestamp('ff', 'local') }}</td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-divider class="mb-4"></v-divider>

        <v-form ref="form" @submit.prevent="submit" :disabled="loading || deleting" class="px-4">
          <div class="font-weight-bold body-1 mb-4" v-if="organization">Edit Fields</div>
          <v-text-field
            v-model="code.value"
            :rules="code.rules"
            label="Organization Code"
            hint="Abbreviation of organization name (UAA or NPS_DENALI)"
            outlined
            counter
            validate-on-blur
            @input="modified = true"
          ></v-text-field>
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Full Name of Organization"
            outlined
            counter
            validate-on-blur
            @input="modified = true"
          ></v-text-field>
          <v-text-field
            v-model="pocName.value"
            :rules="pocName.rules"
            label="POC Name"
            outlined
            validate-on-blur
            @input="modified = true"
          ></v-text-field>
          <v-text-field
            v-model="pocEmail.value"
            :rules="pocEmail.rules"
            label="POC Email"
            outlined
            validate-on-blur
            @input="modified = true"
          ></v-text-field>
          <v-text-field
            v-model="pocTel.value"
            :rules="pocTel.rules"
            label="POC Telephone"
            outlined
            validate-on-blur
            @input="modified = true"
            class="mb-0"
          ></v-text-field>
          <v-btn type="submit" class="hidden" :disabled="!modified">submit</v-btn>
        </v-form>

        <div v-if="organization" class="mb-8 mt-0 mx-4">
          <div class="d-flex justify-start">
            <v-btn
              color="error"
              outlined
              @click="confirmDelete"
              :loading="deleting"
              :disabled="loading"
            >
              <v-icon left>mdi-delete</v-icon>
              Delete Organization
            </v-btn>
          </div>

          <v-divider class="mb-4 mt-6"></v-divider>

          <div class="font-weight-bold body-1 mb-4">Organization Users</div>
          <Loading v-if="usersStatus.loading" class="pb-4"></Loading>
          <Alert v-else-if="organizationUsers.length === 0" type="info" title="No Users Found">
            No users belong to this organization
          </Alert>
          <div v-else>
            <v-divider></v-divider>
            <v-simple-table>
              <tbody>
                <tr v-for="user in organizationUsers" :key="user.id">
                  <td class="text-right">
                    {{user.attributes.name}}
                  </td>
                  <td class="font-weight-bold">
                    {{user.attributes.email}}
                  </td>
                  <td style="width:50px" class="text-right">
                    <v-btn icon small color="error" title="Remove User" @click="removeUser(user)" :loading="removing === user.id"><v-icon x-small>mdi-close</v-icon></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-divider></v-divider>
          </div>
          <Alert v-if="usersStatus.error" type="error" title="Failed to Get Users" class="mt-4 mb-0">
            {{ usersStatus.error }}
          </Alert>
        </div>

      </v-card-text>

      <v-divider></v-divider>

      <Alert v-if="error" type="error" title="Server Error" class="mx-4 mt-4 mb-0">
        {{ error }}
      </Alert>

      <v-card-actions class="px-4 py-4">
        <v-btn
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="loading || deleting || !modified"
          @click="submit"
        >Save Changes</v-btn>
        <v-btn
          text
          @click="clear"
          :disabled="loading || deleting"
        >clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="cancel"
        >close</v-btn>
      </v-card-actions>
    </v-card>
    <ConfirmDialog ref="confirmDelete">
      <Alert type="error" title="Are you sure?">
        This organization <strong>and all of its data</strong> will be permanently deleted. This action cannot be undone.
      </Alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import evt from '@/events'
import { rules } from '@/lib/validators'

export default {
  name: 'AdminOrganizationCreateDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,

      loading: false,
      deleting: false,
      removing: false,
      modified: false,
      error: null,

      organization: null,
      organizationUsers: [],

      code: {
        value: '',
        rules: rules.organization.code
      },
      name: {
        value: '',
        rules: rules.organization.name
      },
      pocName: {
        value: '',
        rules: rules.organization.pocName
      },
      pocEmail: {
        value: '',
        rules: rules.organization.pocEmail
      },
      pocTel: {
        value: '',
        rules: rules.organization.pocName
      }
    }
  },
  computed: {
    ...mapGetters({
      users: 'admin/users',
      usersStatus: 'admin/usersStatus'
    })
  },
  methods: {
    async open (organization) {
      this.dialog = true

      if (organization) {
        this.organization = organization
        this.code.value = organization.code
        this.name.value = organization.name
        this.pocName.value = organization.poc_name
        this.pocEmail.value = organization.poc_email
        this.pocTel.value = organization.poc_tel

        this.getOrganizationsUsers(organization)
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async getOrganizationsUsers (organization) {
      const allUsers = await this.$store.dispatch('admin/fetchUsers')
      const organizationUserIds = organization.users.map(d => d.id)
      this.organizationUsers = allUsers.filter(d => organizationUserIds.includes(d.id))
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
      this.deleting = true
      try {
        await this.$http.admin.delete(`/organizations/${this.organization.id}`)
        evt.$emit('notify', `Organization (${this.organization.code}) has been deleted`, 'success')
        this.resolve(true)
        this.close()
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.deleting = false
      }
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true

      const payload = {
        code: this.code.value,
        name: this.name.value,
        poc_name: this.pocName.value,
        poc_email: this.pocEmail.value,
        poc_tel: this.pocTel.value
      }

      try {
        let organization
        if (this.organization) {
          organization = await this.$http.admin
            .put(`/organizations/${this.organization.id}`, payload)
            .then(d => d.data)
          evt.$emit('notify', `Organization (${organization.code}) has been updated`, 'success')
        } else {
          organization = await this.$http.admin
            .post('/organizations', payload)
            .then(d => d.data)
          evt.$emit('notify', `Organization (${organization.code}) has been created`, 'success')
        }
        this.resolve(organization)
        this.close()
      } catch (err) {
        console.error(err)
        if (err.response && err.response.data.type === 'UniqueViolation') {
          this.error = `Organization code (${payload.code}) already exists`
        } else {
          this.error = this.$errorMessage(err)
        }
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.loading = false
      this.deleting = false
      this.removing = false
      this.modified = false
      this.error = null
      this.$refs.form.resetValidation()

      this.organization = null
      this.organizationUsers = []

      this.code.value = ''
      this.name.value = ''
      this.pocName.value = ''
      this.pocEmail.value = ''
      this.pocTel.value = ''
    },
    cancel () {
      this.resolve(false)
      this.close()
    },
    close () {
      this.clear()
      this.dialog = false
    },
    async removeUser (user) {
      this.removing = user.id
      console.log('removeUser', user.id, this.organization)
      try {
        await this.$http.admin
          .put(`/users/${user.id}`, {
            action: 'removeFromOrganization',
            organizationId: this.organization.id
          })
        evt.$emit('notify', `${user.attributes.email} has been removed from ${this.organization.code}`, 'success')
        const index = this.organization.users.findIndex(d => d.id === user.id)
        if (index >= 0) {
          this.organization.users.splice(index, 1)
        }
        this.getOrganizationsUsers(this.organization)
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.removing = false
      }
    }
  }
}
</script>
