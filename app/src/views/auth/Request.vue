<template>
  <v-card elevation="4">
    <v-toolbar flat dense color="grey lighten-3">
      <span class="text-h6">Request Account</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading || success">
      <v-card-text class="body-1 pt-4 black--text">
        <p>
          Use this form to request an account. An account is <strong>not required to view or download</strong> temperature data. It is only required to upload data.
        </p>
        <p>
          Your name and email will be kept private, and will not be publicly displayed. However, your affiliation will be publicly displayed as the data provider.
        </p>
        <p>
          We may use your email to contact you if we have questions about your photos or data, but we will not share it with any third party.
        </p>
        <!-- <p class="mb-8">
          If you have questions or trouble requesting an account, contact us at <a href="mailto:gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com">gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com</a>.
        </p> -->
        <!-- TODO: add contact info -->

        <v-divider class="my-8"></v-divider>

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
        <v-autocomplete
          :items="provider.options"
          :rules="provider.rules"
          v-model="provider.selected"
          label="Select your affiliation"
          item-text="code"
          outlined
          clearable
          return-object
          :disabled="providerOther"
        >
          <template v-slot:item="data">
            <v-list-item-content>
              <v-list-item-title v-html="data.item.code"></v-list-item-title>
              <v-list-item-subtitle v-html="data.item.name"></v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </v-autocomplete>
        <v-checkbox
          label="My affiliation is not listed"
          v-model="providerOther"
          class="mt-0"
        ></v-checkbox>
        <v-text-field
          v-if="providerOther"
          v-model="providerCode.value"
          :rules="providerCode.rules"
          label="Affiliation Abbreviation"
          counter
          outlined
          maxlength="32"
          hint="Short abbreviation for your affiliation (e.g. UAA). Please only use UPPERCASE letters and underscores."
          validate-on-blur
        ></v-text-field>
        <v-text-field
          v-if="providerOther"
          v-model="providerName.value"
          :rules="providerName.rules"
          label="Affiliation Full Name"
          counter
          outlined
          maxlength="128"
          hint="Full name of your affiliation (e.g. University of Alaska, Anchorage). Please include local branch, office or region if applicable."
          validate-on-blur
        ></v-text-field>
        <v-textarea
          v-model="description.value"
          :rules="description.rules"
          label="Brief Description of Your Data"
          counter
          outlined
          maxlength="500"
          hint="Please briefly describe your monitoring program (what kind of data you collect, what time period, which regions or basins, etc.)"
          validate-on-blur
        ></v-textarea>

        <div class="mt-4">
          <router-link :to="{ name: 'login' }">
            Already have an account?
          </router-link>
        </div>

        <vue-recaptcha
          :sitekey="recaptcha.siteKey"
          @verify="onVerifyRecaptcha"
          @expired="onExpiredRecaptcha"
          ref="recaptcha"
          class="my-4"
        ></vue-recaptcha>

        <Alert v-if="error" type="error" title="Server Error" class="mb-0 mt-4">
          {{error}}
        </Alert>

        <Alert v-else-if="success" type="success" title="Request Submitted" class="mb-0 mt-4">
          <p>
            Your account will be created in the next 1-2 business days. You will then receive an email with a temporary password to complete your account registration.
          </p>
          <p>
            If you don't get an email in the next few days, <strong>please check your spam folder</strong> and then contact us.
            <!-- TODO: add contact email -->
          </p>
          <p class="mb-0">
            Until then, <router-link :to="{ name: 'explorer' }">click here</router-link> to go explore our existing temperature data.
          </p>
        </Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="success"
        >submit</v-btn>
        <v-btn
          text
          @click="clear"
          :disabled="loading || success"
        >clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="$router.push({ name: 'home' })"
        >close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { VueRecaptcha } from 'vue-recaptcha'
import { rules } from '@/lib/validators'

export default {
  name: 'AuthRequest',
  components: { VueRecaptcha },
  data () {
    return {
      loading: false,
      success: false,
      error: null,

      recaptcha: {
        response: null,
        siteKey: process.env.VUE_APP_RECAPTCHA_SITE_KEY
      },

      name: {
        value: '',
        rules: rules.request.name
      },
      email: {
        value: '',
        rules: rules.request.email
      },
      provider: {
        loading: true,
        selected: null,
        options: [],
        rules: [
          v => this.providerOther || !!v || 'Provider is required'
        ]
      },
      providerOther: false,
      providerCode: {
        value: '',
        rules: [
          v => !this.providerOther || !!v || 'Provider code is required'
        ]
      },
      providerName: {
        value: '',
        rules: [
          v => !this.providerOther || !!v || 'Provider name is required'
        ]
      },
      description: {
        value: '',
        rules: rules.request.description
      }
    }
  },
  mounted () {
    this.init()
  },
  errorCaptured (err) {
    this.error = this.$errorMessage(err)
  },
  methods: {
    async init () {
      const providers = await this.$http.public.get('/providers')
        .then(d => d.data)
      this.provider.options = providers
      this.provider.loading = false
    },
    async submit () {
      this.error = null
      this.success = false

      if (!this.$refs.form.validate()) return

      if (!this.recaptcha.response) {
        this.error = 'reCAPTCHA is required, please check the box above.'
        return
      }

      this.loading = true
      const payload = {
        'g-recaptcha-response': this.recaptcha.response,
        name: this.name.value,
        email: this.email.value,
        description: this.description.value
      }
      if (this.providerOther) {
        payload.provider_code = this.providerCode.value
        payload.provider_name = this.providerName.value
      } else {
        payload.provider_id = this.provider.selected.id
        payload.provider_code = this.provider.selected.code
        payload.provider_name = this.provider.selected.name
      }

      try {
        await this.$http.public.post('/requests', payload)
        this.success = true
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.success = false
      this.error = null
      this.$refs.form.resetValidation()
      this.resetRecaptcha()

      this.name.value = ''
      this.email.value = ''
      this.provider.selected = null
      this.providerOther = false
      this.providerCode.value = ''
      this.providerName.value = ''
      this.description.value = ''
    },
    onVerifyRecaptcha (response) {
      this.recaptcha.response = response
    },
    onExpiredRecaptcha () {
      this.error = 'reCAPTCHA has expired. Please try again.'
      this.resetRecaptcha()
    },
    resetRecaptcha () {
      this.$refs.recaptcha.reset() // Direct call reset method
      this.recaptcha.response = null
    }
  }
}
</script>
