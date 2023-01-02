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
          <span v-if="!provider">Create Provider</span>
          <span v-else>Edit Provider</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="cancel"><v-icon small>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 mb-0 black--text">
        <v-simple-table v-if="provider">
          <tbody>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                ID
              </td>
              <td class="font-weight-bold">{{ provider.id }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Created
              </td>
              <td class="font-weight-bold">{{ provider.created_at | timestamp('ff', 'local') }}</td>
            </tr>
            <tr>
              <td
                class="text-right"
                style="width:140px">
                Updated
              </td>
              <td class="font-weight-bold">{{ provider.updated_at | timestamp('ff', 'local') }}</td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-divider class="mb-4"></v-divider>

        <v-form ref="form" @submit.prevent="submit" :disabled="loading || deleting" class="px-4">
          <div class="font-weight-bold body-1 mb-4" v-if="provider">Edit Fields</div>
          <v-text-field
            v-model="code.value"
            :rules="code.rules"
            label="Provider Code"
            hint="Abbreviation of provider name (UAA or NPS_DENALI)"
            outlined
            counter
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Full Name of Provider"
            outlined
            counter
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="pocName.value"
            :rules="pocName.rules"
            label="POC Name"
            outlined
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="pocEmail.value"
            :rules="pocEmail.rules"
            label="POC Email"
            outlined
            validate-on-blur
          ></v-text-field>

          <v-divider class="my-4"></v-divider>

          <div class="font-weight-bold body-1">Organization</div>

          <v-autocomplete
            v-if="dialog"
            v-model="organization.selected"
            :items="organizations"
            :rules="organization.rules"
            item-text="code"
            item-value="id"
            label="Select Organization"
            outlined
            clearable
            :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
            :disabled="organization.new"
            class="mt-4"
          >
            <template v-slot:item="{ item }">
              <v-list-item-content>
                <v-list-item-title v-html="item.code"></v-list-item-title>
                <v-list-item-subtitle v-html="item.name"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>
          <v-checkbox
            v-model="organization.new"
            label="Add to New Organization"
            class="mt-0"
            hide-details
          ></v-checkbox>
          <div v-if="organization.new" class="mt-4">
            <v-text-field
              v-model="organization.code.value"
              :rules="organization.code.rules"
              label="Organization Code"
              hint="Abbreviation in UPPERCASE letters and underscores (UAA or NPS)"
              outlined
              counter
              validate-on-blur
            ></v-text-field>
            <v-text-field
              v-model="organization.name.value"
              :rules="organization.name.rules"
              label="Full Name of Organization"
              outlined
              counter
              validate-on-blur
            ></v-text-field>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="font-weight-bold body-1">Users</div>

          <v-autocomplete
            v-if="dialog"
            v-model="users.selected"
            :items="allUsers"
            label="Select users(s)"
            item-text="attributes.name"
            item-value="id"
            multiple
            chips
            deletable-chips
            outlined
            hide-details
            clearable
            class="my-4"
          >
            <template v-slot:item="{ item }">
              <v-list-item-icon><v-simple-checkbox :value="users.selected && users.selected.includes(item.id)"></v-simple-checkbox></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-html="item.attributes.name"></v-list-item-title>
                <v-list-item-subtitle v-html="item.attributes.email"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>

          <v-divider class="my-4" v-if="provider"></v-divider>

          <div class="d-flex my-4">
            <v-spacer></v-spacer>
            <v-btn
              v-if="provider"
              color="error"
              outlined
              @click="confirmDelete"
              :loading="deleting"
              :disabled="loading"
            >
              <v-icon left>mdi-delete</v-icon>
              Delete Provider
            </v-btn>
          </div>

          <v-btn type="submit" class="hidden">submit</v-btn>
        </v-form>
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
          :disabled="loading || deleting"
          @click="submit"
        >Submit</v-btn>
        <v-btn
          v-if="!provider"
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
        This provider <strong>and all of its data</strong> will be permanently deleted. This action cannot be undone.
      </Alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import evt from '@/events'
import { rules } from '@/lib/validators'

export default {
  name: 'AdminProviderDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,

      loading: false,
      deleting: false,
      error: null,

      provider: null,

      code: {
        value: '',
        rules: rules.provider.code
      },
      name: {
        value: '',
        rules: rules.provider.name
      },
      pocName: {
        value: '',
        rules: rules.provider.pocName
      },
      pocEmail: {
        value: '',
        rules: rules.provider.pocEmail
      },
      users: {
        selected: []
      },
      organization: {
        new: false,
        selected: null,
        rules: [],
        code: {
          value: '',
          rules: rules.organization.code
        },
        name: {
          value: '',
          rules: rules.organization.name
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      allUsers: 'admin/users',
      organizations: 'admin/organizations'
    })
  },
  methods: {
    async open (provider) {
      this.dialog = true
      this.$store.dispatch('admin/fetchUsers')

      if (provider) {
        this.provider = provider
        this.code.value = provider.code
        this.name.value = provider.name
        this.pocName.value = provider.poc_name
        this.pocEmail.value = provider.poc_email
        this.users.selected = provider.users.map(d => d.id)
        this.organization.selected = provider.organization_id
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteProvider()
      }
    },
    async deleteProvider () {
      this.deleting = true
      try {
        await this.$http.admin.delete(`/providers/${this.provider.id}`)
        evt.$emit('notify', `Provider (${this.provider.code}) has been deleted`, 'success')
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

      if (this.organization.new) {
        this.organization.code.value = this.organization.code.value.toUpperCase()
        const payload = {
          code: this.organization.code.value,
          name: this.organization.name.value
        }
        try {
          const newOrganization = await this.$http.admin
            .post('/organizations', payload)
            .then(d => d.data)
          await this.$store.dispatch('admin/fetchOrganizations')
          this.organization.selected = newOrganization.id
          this.organization.new = false
          return newOrganization
        } catch (err) {
          console.error(err)
          if (err.response && err.response.data.type === 'UniqueViolation') {
            this.error = `Organization code (${payload.code}) already exists`
          } else {
            this.error = this.$errorMessage(err)
          }
          this.loading = false
          return
        }
      }

      this.loading = true

      const payload = {
        code: this.code.value,
        name: this.name.value,
        poc_name: this.pocName.value,
        poc_email: this.pocEmail.value,
        organization_id: this.organization.selected,
        users: this.users.selected
      }

      try {
        let provider
        if (this.provider) {
          provider = await this.$http.admin
            .put(`/providers/${this.provider.id}`, payload)
            .then(d => d.data)
          evt.$emit('notify', `Provider (${provider.code}) has been updated`, 'success')
        } else {
          provider = await this.$http.admin
            .post('/providers', payload)
            .then(d => d.data)
          evt.$emit('notify', `Provider (${provider.code}) has been created`, 'success')
        }
        this.resolve(provider)
        this.close()
      } catch (err) {
        console.error(err)
        if (err.response && err.response.data.type === 'UniqueViolation') {
          this.error = `Provider code (${payload.code}) already exists`
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
      this.error = null
      this.$refs.form.resetValidation()

      this.provider = null

      this.code.value = ''
      this.name.value = ''
      this.pocName.value = ''
      this.pocEmail.value = ''
      this.users.selected = []
      this.organization.new = false
      this.organization.selected = null
      this.organization.code.value = ''
      this.organization.name.value = ''
    },
    cancel () {
      this.resolve(false)
      this.close()
    },
    close () {
      this.clear()
      this.dialog = false
    }
  }
}
</script>
