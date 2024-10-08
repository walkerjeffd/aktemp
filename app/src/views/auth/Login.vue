<template>
  <v-card elevation="4">
    <v-toolbar flat dense color="grey lighten-3">
      <span class="text-h6">Log In</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading || success">
      <v-card-text class="body-2 pt-8">
        <v-alert
          type="success"
          text
          colored-border
          border="left"
          class="body-2 mb-8"
          :value="!!$route.query.verified"
        >
          <div class="font-weight-bold body-1">
            Your email has been verified. Please log in.
          </div>
        </v-alert>
        <v-alert
          type="success"
          text
          colored-border
          border="left"
          class="body-2 mb-8"
          :value="!!$route.query.reset"
        >
          <div class="font-weight-bold body-1">
            Your password has been reset. Please log in.
          </div>
        </v-alert>
        <v-text-field
          v-model="email.value"
          :rules="email.rules"
          label="Email Address"
          required
          outlined
          validate-on-blur
        ></v-text-field>
        <v-text-field
          v-model="password.value"
          :rules="password.rules"
          label="Password"
          required
          outlined
          validate-on-blur
          type="password"
        ></v-text-field>

        <div v-if="newNameRequired">
          <div class="text-subtitle-1 mb-2 black--text">Enter your name</div>
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Full Name"
            required
            outlined
            validate-on-blur
          ></v-text-field>
        </div>

        <div v-if="newPasswordRequired">
          <div class="text-subtitle-1 mb-2 black--text">Enter your new password</div>
          <v-text-field
            v-model="newPassword.value"
            :rules="newPassword.rules"
            label="New Password"
            required
            outlined
            validate-on-blur
            type="password"
          ></v-text-field>
          <v-text-field
            v-model="repeatNewPassword.value"
            :rules="repeatNewPassword.rules"
            label="Confirm New Password"
            required
            outlined
            validate-on-blur
            type="password"
          ></v-text-field>
        </div>

        <div>
          <router-link :to="{ name: 'resetPassword' }">Forgot your password?</router-link><br>
          <router-link :to="{ name: 'request' }">Don't have an account?</router-link>
        </div>

        <Alert type="error" title="Server Error" class="mb-0 mt-4" v-if="error">
          {{error}}
        </Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="loading"
        >submit</v-btn>
        <v-btn text @click="clear" :disabled="loading">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$router.push({ name: 'home' })">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { required, email, minLength, maxLength } from 'vuelidate/lib/validators'
import { passwordStrength } from '@/lib/validators'

import evt from '@/events'

export default {
  name: 'Login',
  data () {
    return {
      loading: false,
      success: false,
      error: null,
      email: {
        // value: 'jeff@walkerenvres.com',
        value: null,
        rules: [
          v => required(v) || 'Email is required',
          v => email(v) || 'Email must be a valid email address'
        ]
      },
      password: {
        // value: 'Aktemp123',
        value: null,
        rules: [
          v => required(v) || 'Password is required'
        ]
      },
      newNameRequired: false,
      name: {
        value: '',
        rules: [
          v => (this.newNameRequired && required(v)) || 'Name is required'
        ]
      },
      newPasswordRequired: false,
      newPassword: {
        value: '',
        rules: [
          v => required(v) || 'New password is required',
          v => minLength(8)(v) || 'Must be at least 8 characters',
          v => maxLength(32)(v) || 'Cannot be more than 32 characters',
          v => passwordStrength(v) || 'Must contain at least one lowercase letter, one uppercase letter and one number'
        ]
      },
      repeatNewPassword: {
        value: '',
        rules: [
          v => (v === this.newPassword.value) || 'Passwords do not match'
        ]
      }
    }
  },
  methods: {
    async submit () {
      if (this.newPasswordRequired) return this.submitNewPassword()

      this.error = null
      if (!this.$refs.form.validate()) return

      let user
      try {
        this.loading = true
        user = await this.$Amplify.Auth.signIn(this.email.value, this.password.value)
      } catch (err) {
        if (err.code && err.code === 'UserNotConfirmedException') {
          evt.$emit('localUser', { username: this.email.value })
          evt.$emit('authState', { state: 'confirmSignUp' })
        } else {
          console.error(err)
          this.error = this.$errorMessage(err)
          return
        }
      } finally {
        this.loading = false
      }

      if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
        this.newPasswordRequired = true
        if (user.challengeParam.requiredAttributes.includes('name')) {
          this.newNameRequired = true
        }
        this.user = user
      } else {
        const redirect = this.$route.query.redirect
          ? { path: this.$route.query.redirect }
          : { name: 'manage' }
        this.success = true
        evt.$emit('notify', `Welcome back, ${user.attributes.name}!`, 'success')
        return evt.$emit('authState', {
          state: 'signIn',
          redirect
        })
      }
    },
    async submitNewPassword () {
      this.error = null

      if (!this.$refs.form.validate()) return

      const attributes = {}
      if (this.newNameRequired) {
        attributes.name = this.name.value
      }

      this.loading = true
      this.success = false
      this.$Amplify.Auth.completeNewPassword(this.user, this.newPassword.value, attributes)
        .then(user => {
          const redirect = this.$route.query.redirect
            ? { path: this.$route.query.redirect }
            : { name: 'manage' }
          this.success = true
          return evt.$emit('authState', {
            state: 'signIn',
            redirect
          })
        })
        .catch((err) => {
          console.error(err)
          this.loading = false
          this.error = this.$errorMessage(err)
        })
    },
    clear () {
      this.loading = false
      this.error = null
      this.success = false
      this.$refs.form.resetValidation()

      this.newPasswordRequired = false
      this.newNameRequired = false

      this.email.value = ''
      this.password.value = ''
      this.newPassword.value = ''
      this.repeatNewPassword.value = ''
    }
  }
}
</script>
