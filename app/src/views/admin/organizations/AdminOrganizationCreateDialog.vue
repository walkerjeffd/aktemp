<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="close"
  >
    <v-card style="width:600px">
      <v-toolbar flat :color="options.color">
        <v-toolbar-title class="text-h5">
          Create Organization
        </v-toolbar-title>
      </v-toolbar>

      <v-form ref="form" @submit.prevent="submit" :disabled="loading">
        <v-card-text class="mt-4 mb-0">
          <v-text-field
            v-model="code.value"
            :rules="code.rules"
            label="Code (Abbreviation)"
            hint="Capital letters and underscores only (NPS_DNP)"
            persistent-hint
            required
            outlined
            validate-on-blur
          ></v-text-field>

          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Name"
            hint="Descriptive name (National Park Service, Denali National Park)"
            persistent-hint
            required
            outlined
            validate-on-blur
          ></v-text-field>

          <Alert type="error" title="Server Error" v-if="error">
            {{ error }}
          </Alert>
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
import { required } from 'vuelidate/lib/validators'

export default {
  name: 'AdminOrganizationCreateDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      options: {
        color: 'grey lighten-2',
        width: 800,
        zIndex: 5000
      },
      loading: false,
      error: null,
      code: {
        value: '',
        rules: [
          v => required(v) || 'Code is required'
        ]
      },
      name: {
        value: '',
        rules: [
          v => required(v) || 'Name is required'
        ]
      }
    }
  },
  methods: {
    async open () {
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
        code: this.code.value,
        name: this.name.value
      }

      try {
        const response = await this.$http.admin.post('/organizations', payload)
        const data = response.data
        this.clear()
        this.resolve(data)
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
      this.code.value = ''
      this.name.value = ''
    },
    close () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
