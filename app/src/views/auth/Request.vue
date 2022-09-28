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
          Your name and email will be kept private, and will not be publicly displayed. However, your organization will be publicly displayed as the owner of your data.
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
        <v-text-field
          v-model="organization.value"
          :rules="organization.rules"
          label="Organization"
          counter
          outlined
          maxlength="128"
          hint="Full name of your organization (e.g. University of Alaska, Anchorage). Please include branch or office if applicable."
          validate-on-blur
        ></v-text-field>
        <v-text-field
          v-model="abbreviation.value"
          :rules="abbreviation.rules"
          label="Organization Abbreviation"
          counter
          outlined
          maxlength="16"
          hint="Short abbreviation for your organization (e.g. UAA). Please only use UPPERCASE letters and underscores."
          validate-on-blur
        ></v-text-field>
        <v-textarea
          v-model="description.value"
          :rules="description.rules"
          label="Brief Description"
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
import { rules } from '@/lib/validators'

export default {
  name: 'AuthRequest',
  data () {
    return {
      loading: false,
      success: false,
      error: null,

      name: {
        value: '',
        rules: rules.request.name
      },
      email: {
        value: '',
        rules: rules.request.email
      },
      organization: {
        value: '',
        rules: rules.request.organization
      },
      abbreviation: {
        value: '',
        rules: rules.request.abbreviation
      },
      description: {
        value: '',
        rules: rules.request.description
      }
    }
  },
  methods: {
    async submit () {
      this.error = null
      this.success = false

      if (!this.$refs.form.validate()) return

      this.loading = true
      const payload = {
        name: this.name.value,
        email: this.email.value,
        organization: this.organization.value,
        abbreviation: this.abbreviation.value,
        description: this.description.value
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

      this.name.value = ''
      this.email.value = ''
      this.organization.value = ''
      this.abbreviation.value = ''
      this.description.value = ''
    }
  }
}
</script>
