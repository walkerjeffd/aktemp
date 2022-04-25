<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-toolbar flat :color="options.color">
        <v-toolbar-title class="text-h5">
          Create Organization
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

          <v-alert
            type="error"
            text
            colored-border
            border="left"
            class="body-2 mb-0"
            v-if="error"
          >
            <div class="body-1 font-weight-bold">Server Error</div>
            <div>{{ error }}</div>
          </v-alert>
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
        width: 600,
        zIndex: 5000
      },
      loading: false,
      error: null,
      name: {
        value: '',
        rules: [
          v => required(v) || 'Name is required'
        ]
      }
    }
  },
  methods: {
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
        this.err = err.toString() || 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.error = null
      this.$refs.form.resetValidation()
      this.name.value = ''
    },
    close () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
