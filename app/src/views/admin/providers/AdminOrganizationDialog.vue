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
            hint="Abbreviation of organization name (NPS or USGS)"
            outlined
            counter
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Full Name of Organization"
            outlined
            counter
            validate-on-blur
          ></v-text-field>

          <v-divider class="my-4"></v-divider>

          <div class="font-weight-bold body-1">Providers</div>
          <v-autocomplete
            v-if="dialog"
            v-model="organizationProviders.selected"
            :items="providers"
            label="Select provider(s)"
            item-text="code"
            item-value="id"
            multiple
            chips
            deletable-chips
            outlined
            clearable
            hide-details
            class="my-4"
          >
            <template v-slot:item="{ item }">
              <v-list-item-icon>
                  <v-simple-checkbox @input="toggleProvider(item.id)" :value="organizationProviders.selected && organizationProviders.selected.includes(item.id)"></v-simple-checkbox>
                </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-html="item.code"></v-list-item-title>
                <v-list-item-subtitle v-html="item.name"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>

          <v-divider class="my-4" v-if="organization"></v-divider>

          <div v-if="organization" class="d-flex my-4">
            <v-spacer></v-spacer>
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
          <v-btn type="submit" class="hidden">submit</v-btn>
        </v-form>
      </v-card-text>

      <Alert v-if="error" type="error" title="Failed to Save Organization" class="mx-4 mb-0">
        {{ error }}
      </Alert>

      <v-divider></v-divider>

      <v-card-actions class="px-4 py-4">
        <v-btn
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="loading || deleting"
          @click="submit"
        >Submit</v-btn>
        <v-btn
          v-if="!organization"
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
        <p>
          This organization will be permanently deleted.
        </p>
        <p>
          However, providers belonging to this organization will <strong>NOT</strong> be deleted.
        </p>
        <p class="mb-0">
          This action cannot be undone.
        </p>
      </Alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import evt from '@/events'
import { rules } from '@/lib/validators'

export default {
  name: 'AdminOrganizationDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,

      loading: false,
      deleting: false,
      removing: false,
      error: null,

      organization: null,

      code: {
        value: '',
        rules: rules.organization.code
      },
      name: {
        value: '',
        rules: rules.organization.name
      },
      organizationProviders: {
        selected: []
      }
    }
  },
  computed: {
    ...mapGetters({
      providers: 'admin/providers',
      providersStatus: 'admin/providersStatus'
    })
  },
  methods: {
    async open (organization) {
      this.dialog = true

      await this.$store.dispatch('admin/fetchProviders')

      if (organization) {
        this.organization = organization
        this.code.value = organization.code
        this.name.value = organization.name
        this.organizationProviders.selected = organization.providers.map(d => d.id)
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
        providers: this.organizationProviders.selected
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
      this.error = null
      this.$refs.form.resetValidation()

      this.organization = null

      this.code.value = ''
      this.name.value = ''
      this.organizationProviders.selected = []
    },
    cancel () {
      this.resolve(false)
      this.close()
    },
    close () {
      this.clear()
      this.dialog = false
    },
    toggleProvider (providerId) {
      if (this.organizationProviders.selected.includes(providerId)) {
        this.organizationProviders.selected = this.organizationProviders.selected.filter(p => p !== providerId)
      } else {
        this.organizationProviders.selected.push(providerId)
      }
    }
  }
}
</script>
