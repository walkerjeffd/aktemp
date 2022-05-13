<template>
  <v-dialog
    v-model="dialog"
    scrollable
    @keydown.esc="close"
  >
    <v-card style="width:600px">
      <v-toolbar flat color="grey lighten-2">
        <v-toolbar-title class="text-h5">
          Create User
        </v-toolbar-title>
      </v-toolbar>

      <v-form ref="form" @submit.prevent="submit" :disabled="loading">
        <v-card-text class="mt-4 mb-0">
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Name"
            required
            outlined
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="email.value"
            :rules="email.rules"
            label="Email Address"
            required
            outlined
            validate-on-blur
          ></v-text-field>
          <v-select
            v-model="organizations.selected"
            :items="organizationsOptions"
            :rules="organizations.rules"
            label="Select organization(s)"
            multiple
            chips
            deletable-chips
            item-text="name"
            item-value="id"
            outlined
            required
            :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
          ></v-select>
          <v-switch
            v-model="admin.value"
            label="Administrator"
            class="mt-0"
          ></v-switch>

          <Alert type="warning" title="Warning" v-if="admin.value" class="mt-0">
            Administrators have full read/write access to all organizations.
          </Alert>

          <Alert type="error" title="Failed to Create User" v-if="error">{{ error }}</Alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-4 py-4">
          <v-btn
            type="submit"
            color="primary"
            class="mr-4"
            :loading="loading"
            :disabled="loading"
          >submit</v-btn>
          <v-btn
            text
            @click="clear"
            :disabled="loading"
          >clear</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click.native="close"
          >close</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'CreateUserDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      loading: false,
      error: null,
      name: {
        value: '',
        rules: [
          v => required(v) || 'Name is required'
        ]
      },
      email: {
        value: '',
        rules: [
          v => required(v) || 'Email is required',
          v => email(v) || 'Must be a valid email address'
        ]
      },
      organizations: {
        selected: null,
        rules: [
          v => !!v ||
            this.admin.value ||
            'Organization is required'
        ]
      },
      admin: {
        value: false
      }
    }
  },
  computed: {
    ...mapGetters({ organizationsOptions: 'admin/organizations' })
  },
  mounted () {
    this.fetchOrganizations()
  },
  methods: {
    ...mapActions({ fetchOrganizations: 'admin/fetchOrganizations' }),
    async open (id) {
      this.dialog = true

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true
      const payload = {
        name: this.name.value,
        email: this.email.value,
        admin: this.admin.value,
        organizationIds: this.organizations.selected
      }

      try {
        const response = await this.$http.admin.post('/users', payload)
        const user = response.data
        this.clear()
        this.resolve(user)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.error = err.toString() || 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.error = null
      this.$refs.form.resetValidation()
      this.name.value = ''
      this.email.value = ''
      this.organizations.selected = null
      this.admin.value = false
    },
    close () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
