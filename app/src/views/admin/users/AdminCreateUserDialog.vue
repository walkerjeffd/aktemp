<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="600"
    @keydown.esc="close"
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
            <pre class="d-block ml-4 mb-4">
              Submitted: {{ request.created_at | timestampFormat('lll z') }}
              Name: {{ request.name }}
              Email: {{ request.email }}
              Organization: {{ request.organization }}
              Abbreviation: {{ request.abbreviation }}
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

          <div class="font-weight-bold body-1 mb-4">User Organization(s)</div>

          <v-autocomplete
            v-model="organizations.selected"
            :items="organizationsOptions"
            item-text="name"
            item-value="id"
            :rules="organizations.rules"
            label="Select existing organization(s)"
            multiple
            chips
            deletable-chips
            outlined
            required
            :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
            :disabled="organization.new"
            class="mt-4"
          ></v-autocomplete>
          <v-checkbox
            v-model="organization.new"
            label="Add to New Organization"
            class="mt-0"
          ></v-checkbox>
          <div v-if="organization.new">
            <v-text-field
              v-model="organization.code.value"
              :rules="organization.code.rules"
              label="Organization Code"
              hint="Abbreviation in UPPERCASE letters and underscores (UAA or NPS_DENALI)"
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
            <v-text-field
              v-model="organization.pocName.value"
              :rules="organization.pocName.rules"
              label="POC Name"
              outlined
              validate-on-blur
            ></v-text-field>
            <v-text-field
              v-model="organization.pocEmail.value"
              :rules="organization.pocEmail.rules"
              label="POC Email"
              outlined
              validate-on-blur
            ></v-text-field>
            <v-text-field
              v-model="organization.pocTel.value"
              :rules="organization.pocTel.rules"
              label="POC Telephone"
              outlined
              validate-on-blur
            ></v-text-field>
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
      organizations: {
        selected: null,
        rules: []
      },
      organization: {
        new: false,
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
    }
  },
  computed: {
    ...mapGetters({ organizationsOptions: 'admin/organizations' })
  },
  async mounted () {
    await this.fetchOrganizations()
  },
  methods: {
    ...mapActions({ fetchOrganizations: 'admin/fetchOrganizations' }),
    async ignoreRequest () {
      evt.$emit('notify', `Account request (${this.request.email}) has been ignored`, 'success')
      this.clear()
      this.resolve(true)
      this.dialog = false
    },
    async open (request) {
      this.dialog = true

      if (request) {
        this.request = request
        this.name.value = request.name
        this.email.value = request.email
        this.organization.pocName.value = request.name
        this.organization.pocEmail.value = request.email
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

      let organizationIds = this.organizations.selected
      if (this.organization.new) {
        this.organization.code.value = this.organization.code.value.toUpperCase()
        const payload = {
          code: this.organization.code.value,
          name: this.organization.name.value,
          poc_name: this.organization.pocName.value,
          poc_email: this.organization.pocEmail.value,
          poc_tel: this.organization.pocTel.value
        }
        try {
          const organization = await this.$http.admin
            .post('/organizations', payload)
            .then(d => d.data)
          organizationIds = [organization.id]
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

      try {
        const payload = {
          name: this.name.value,
          email: this.email.value,
          admin: this.admin.value,
          organizationIds
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

        if (this.organization.new) {
          // delete newly created organization since user was not created
          await this.$http.admin
            .delete(`/organizations/${organizationIds[0]}`)
        }
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

      this.organizations.selected = null

      this.organization.new = false
      this.organization.code.value = ''
      this.organization.name.value = ''
      this.organization.pocName.value = ''
      this.organization.pocEmail.value = ''
      this.organization.pocTel.value = ''
    },
    close () {
      this.clear()
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
