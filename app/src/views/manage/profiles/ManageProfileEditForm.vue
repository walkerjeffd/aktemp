<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="800"
    @keydown.esc="close"
    style="z-index:5000"
  >
    <v-card>
      <v-toolbar flat dense color="grey lighten-2">
        <v-toolbar-title class="text-h6">
          Edit Vertical Profile Metadata
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="close" class="mr-0">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="body-2 pa-4">
        <v-form ref="form" @submit.prevent="submit" :disabled="loading">
          <v-select
            v-model="station.value"
            :items="stations"
            :rules="station.rules"
            item-text="code"
            item-value="id"
            label="Station"
            validate-on-blur
            outlined
          ></v-select>
          <v-select
            v-model="accuracy.value"
            :items="accuracy.options"
            :rules="accuracy.rules"
            item-text="label"
            item-value="value"
            label="Sensor Accuracy"
            validate-on-blur
            outlined
            clearable
          ></v-select>
          <v-select
            v-model="reviewed.value"
            :items="reviewed.options"
            :rules="reviewed.rules"
            item-text="label"
            item-value="value"
            label="Has profile undergone QAQC review?"
            validate-on-blur
            outlined
            clearable
          ></v-select>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <Alert type="error" title="Failed to Save Vertical Profile Metadata" v-if="error" class="mt-4 mx-4 mb-0">{{error}}</Alert>

      <v-card-actions class="pa-4">
        <v-btn
          color="primary"
          class="mr-4"
          :loading="loading"
          @click="submit"
        >submit</v-btn>
        <v-btn text @click="reset" :disabled="loading">reset</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="close">cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'

import evt from '@/events'

const {
  booleanOptions,
  sensorAccuracyOptions
} = require('aktemp-utils/constants')
const { validateProfile } = require('aktemp-utils/validators')

export default {
  name: 'ManageProfileEditForm',
  data () {
    return {
      resolve: null,
      reject: null,

      dialog: false,
      loading: false,
      error: null,

      profile: null,

      station: {
        value: null,
        rules: [
          v => !!v || 'Station is required'
        ]
      },
      accuracy: {
        value: null,
        options: sensorAccuracyOptions,
        rules: []
      },
      reviewed: {
        value: null,
        options: booleanOptions,
        rules: []
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      organization: 'manage/organization',
      stations: 'manage/stations'
    })
  },
  methods: {
    open (profile) {
      this.dialog = true
      this.profile = profile
      this.$nextTick(() => {
        this.reset()
      })
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) {
        this.error = 'Check form validation errors above'
        return
      }

      this.loading = true
      const value = {
        station_id: this.station.value,
        accuracy: this.accuracy.value,
        reviewed: this.reviewed.value
      }

      let payload
      try {
        payload = validateProfile(value, this.stations)
      } catch (err) {
        this.error = err.toString()
        this.loading = false
        return
      }

      try {
        const response = await this.$http.restricted
          .put(`/profiles/${this.profile.id}`, payload)
        evt.$emit('notify', `Profile (id=${this.profile.id}) has been updated`, 'success')

        this.dialog = false
        this.resolve(response.data)
      } catch (err) {
        if (err.response && err.response.data.message) {
          this.error = err.response.data.message
        } else {
          this.error = this.$errorMessage(err)
        }
      } finally {
        this.loading = false
      }
    },
    reset () {
      if (this.loading || !this.$refs.form) return
      this.$refs.form.resetValidation()
      this.loading = false
      this.error = null

      if (this.profile) {
        this.station.value = this.profile.station_id
        this.accuracy.value = this.profile.accuracy
        this.reviewed.value = this.profile.reviewed
      } else {
        this.station.value = null
        this.accuracy.value = null
        this.reviewed.value = null
      }
    },
    close () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
