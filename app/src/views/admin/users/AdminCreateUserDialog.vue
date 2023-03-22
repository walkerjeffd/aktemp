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
          Create User
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="close"><v-icon small>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pt-4 pb-0 mb-0 black--text">
        <v-form ref="form" @submit.prevent="submit" :disabled="loading">
          <div v-if="request">
            <div class="font-weight-bold body-1">User Request</div>
            <pre class="d-block mt-4 mb-4">
              Submitted: {{ request.created_at | timestamp('ff', 'local') }}
              Name: {{ request.name }}
              Email: {{ request.email }}
              Provider: {{ request.provider_name }} ({{ request.provider_code }})
              Description: {{ request.description }}
            </pre>
            <div class="text-right">
              <v-btn color="error" outlined small @click="ignoreRequest">
                <v-icon left small>mdi-close</v-icon> Ignore Request
              </v-btn>
            </div>

            <v-divider class="mt-4 mb-4"></v-divider>
          </div>

          <div class="font-weight-bold body-1 mb-4">New User</div>
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Name"
            outlined
            validate-on-blur
            persistent-hint
          ></v-text-field>
          <v-text-field
            v-model="email.value"
            :rules="email.rules"
            label="Email Address"
            outlined
            validate-on-blur
            persistent-hint
          ></v-text-field>

          <v-checkbox
            v-model="admin.value"
            label="Administrator"
            class="mt-0 mb-0"
          ></v-checkbox>

          <Alert type="warning" title="Warning" v-if="admin.value" class="mt-0 mb-8">
            This user will have full read/write access to all data and user accounts.
          </Alert>

          <v-divider class="mb-4"></v-divider>

          <div class="font-weight-bold body-1 mb-4">User Provider(s)</div>

          <v-autocomplete
            v-if="dialog"
            v-model="providers.selected"
            :items="providersOptions"
            :rules="providers.rules"
            item-text="code"
            item-value="id"
            label="Select existing provider(s)"
            multiple
            chips
            deletable-chips
            outlined
            :disabled="provider.new"
            class="mt-4"
          >
            <template v-slot:item="{ item }">
              <v-list-item-icon>
                <v-simple-checkbox @input="toggleProvider(item.id)" :value="providers.selected && providers.selected.includes(item.id)"></v-simple-checkbox>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-html="item.code"></v-list-item-title>
                <v-list-item-subtitle v-html="item.name"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>
          <v-checkbox
            v-model="provider.new"
            label="Add User to New Provider"
            class="mt-0"
          ></v-checkbox>
          <div v-if="provider.new">
            <v-text-field
              v-model="provider.code.value"
              :rules="provider.code.rules"
              label="Provider Code"
              hint="Abbreviation in letters and underscores (UAA or NPS_DENALI)"
              outlined
              counter
              validate-on-blur
            ></v-text-field>
            <v-text-field
              v-model="provider.name.value"
              :rules="provider.name.rules"
              label="Full Name of Provider"
              outlined
              counter
              validate-on-blur
            ></v-text-field>
            <v-text-field
              v-model="provider.pocName.value"
              :rules="provider.pocName.rules"
              label="POC Name"
              outlined
              validate-on-blur
            ></v-text-field>
            <v-text-field
              v-model="provider.pocEmail.value"
              :rules="provider.pocEmail.rules"
              label="POC Email"
              outlined
              validate-on-blur
            ></v-text-field>

            <v-autocomplete
              v-if="dialog"
              v-model="provider.organization.selected"
              :items="organizations"
              :rules="provider.organization.rules"
              item-text="code"
              item-value="id"
              label="Select Organization"
              outlined
              clearable
              :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
            >
              <template v-slot:item="{ item }">
                <v-list-item-content>
                  <v-list-item-title v-html="item.code"></v-list-item-title>
                  <v-list-item-subtitle v-html="item.name"></v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </v-autocomplete>
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
          :disabled="loading"
          @click="submit"
        >submit</v-btn>
        <v-btn
          text
          @click="clear"
          :disabled="loading"
        >clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="close"
        >close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { rules } from '@/lib/validators'
import evt from '@/events'

export default {
  name: 'AdminCreateUserDialog',
  data () {
    return {
      dialog: false,

      resolve: null,
      reject: null,

      loading: false,
      error: null,

      request: null,

      name: {
        value: '',
        rules: rules.user.name
      },
      email: {
        value: '',
        rules: rules.user.email
      },
      admin: {
        value: false
      },
      providers: {
        selected: null,
        rules: []
      },
      provider: {
        new: false,
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
        organization: {
          selected: null,
          rules: []
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      providersOptions: 'admin/providers',
      organizations: 'admin/organizations'
    })
  },
  methods: {
    ...mapActions({ fetchProviders: 'admin/fetchProviders' }),
    async ignoreRequest () {
      evt.$emit('notify', `Account request (${this.request.email}) has been ignored`, 'success')
      this.clear()
      this.resolve(true)
      this.dialog = false
    },
    async open (request) {
      this.dialog = true
      await this.fetchProviders()

      if (request) {
        this.request = request
        this.name.value = request.name
        this.email.value = request.email
        if (request.provider_id) {
          this.providers.selected = [request.provider_id]
        } else {
          this.providers.selected = []
        }
        this.provider.code.value = request.provider_code
        this.provider.name.value = request.provider_name
        this.provider.pocName.value = request.name
        this.provider.pocEmail.value = request.email
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true

      if (this.provider.new) {
        const payload = {
          code: this.provider.code.value,
          name: this.provider.name.value,
          poc_name: this.provider.pocName.value,
          poc_email: this.provider.pocEmail.value,
          organization_id: this.provider.organization.selected
        }
        try {
          const provider = await this.$http.admin
            .post('/providers', payload)
            .then(d => d.data)
          this.providers.selected = [provider.id]
        } catch (err) {
          console.error(err)
          if (err.response && err.response.data.type === 'UniqueViolation') {
            this.error = `Provider code (${payload.code}) already exists`
          } else {
            this.error = this.$errorMessage(err)
          }
          this.loading = false
          return
        }
      }

      try {
        const payload = {
          name: this.name.value,
          email: this.email.value,
          admin: this.admin.value,
          providerIds: this.providers.selected
        }

        const user = await this.$http.admin
          .post('/users', payload)
          .then(d => d.data)
        evt.$emit('notify', `User (${payload.email}) has been created`, 'success')
        this.clear()
        this.resolve(user)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.loading = false
      this.error = null
      this.$refs.form.resetValidation()

      this.name.value = ''
      this.email.value = ''
      this.admin.value = false

      this.providers.selected = []

      this.provider.new = false
      this.provider.code.value = ''
      this.provider.name.value = ''
      this.provider.pocName.value = ''
      this.provider.pocEmail.value = ''
      this.provider.organization.selected = null
    },
    close () {
      this.clear()
      this.resolve(false)
      this.dialog = false
    },
    toggleProvider (providerId) {
      if (this.providers.selected.includes(providerId)) {
        this.providers.selected = this.providers.selected.filter(p => p !== providerId)
      } else {
        this.providers.selected.push(providerId)
      }
      this.modified = true
    }
  }
}
</script>
