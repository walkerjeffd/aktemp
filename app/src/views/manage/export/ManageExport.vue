<template>
  <v-row justify="space-around">
    <v-col cols="12" lg="6">
      <v-card elevation="2">
        <v-card-title primary-title>
          <div class="text-h6">Data Export</div>
        </v-card-title>
        <v-card-text class="black--text">
          <p>Use this form to request an export of all data for the selected organization. A zip file will be automatically generated and include the stations metadata, raw timeseries values (includes QAQC flags), and vertical profile data. When the file is ready, a download link will be emailed to you. If you do not receive an email within an hour, please check your spam folder and then contact us for help.</p>
          <v-form class="mt-4" ref="form" @submit="submit">
            <div class="secondary--text">Select organization to export</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  :items="organizations"
                  v-model="organization.selected"
                  :rules="organization.rules"
                  label="Organization"
                  item-text="code"
                  item-value="id"
                  outlined
                  hide-details
                  class="mt-4"
                ></v-select>
              </v-col>
            </v-row>

            <div class="secondary--text mt-6">Provide your email address to receive the data download.</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="email.value"
                  :rules="email.rules"
                  label="Email Address"
                  required
                  outlined
                  validate-on-blur
                  class="mt-4"
                ></v-text-field>
              </v-col>
            </v-row>

            <vue-recaptcha
              :sitekey="recaptcha.siteKey"
              @verify="onVerifyRecaptcha"
              @expired="onExpiredRecaptcha"
              ref="recaptcha"
              class="mb-4"
            ></vue-recaptcha>

            <Alert
              v-if="error"
              type="error"
              title="Export Request Failed"
            >
              {{ error }}
            </Alert>

            <v-btn color="primary" @click="submit" :loading="loading">Submit</v-btn>
          </v-form>
        </v-card-text>

      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { VueRecaptcha } from 'vue-recaptcha'
import { email } from '@/lib/validators'
import evt from '@/events'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageExport',
  components: { VueRecaptcha },
  data () {
    return {
      loading: false,
      error: null,
      recaptcha: {
        response: null,
        siteKey: process.env.VUE_APP_RECAPTCHA_SITE_KEY
      },
      organization: {
        selected: null,
        rules: [
          v => !!v || 'Organization is required'
        ]
      },
      email: {
        value: null,
        rules: [
          v => !!v || 'Email is required',
          v => email(v) || 'Email must be a valid email address'
        ]
      }
    }
  },
  computed: {
    ...mapGetters({
      user: 'user',
      organizations: 'manage/organizations'
    })
  },
  mounted () {
    if (this.user && this.user.attributes && this.user.attributes.email) {
      this.email.value = this.user.attributes.email
    }
    if (this.$store.getters['manage/organization']) {
      this.organization.selected = this.$store.getters['manage/organization'].id
    }
  },
  methods: {
    async submit () {
      if (!this.$refs.form.validate()) return
      if (!this.recaptcha.response) {
        this.error = 'reCAPTCHA is required, please check the box above and try again.'
        return
      }

      this.loading = true
      this.error = null

      try {
        const payload = {
          'g-recaptcha-response': this.recaptcha.response,
          email: this.email.value,
          organizationId: this.organization.selected,
          export: true
        }
        console.log(payload)

        await this.$http.public.post('/downloads', payload)
        evt.$emit('notify', 'Export request has been submitted. Check your email for download link.', 'success')
        this.$router.push({ name: 'manageStations' })
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
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
