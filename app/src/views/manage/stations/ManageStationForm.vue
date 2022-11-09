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
          <span v-if="!station">Create Station</span>
          <span v-else>Edit Station</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small @click="close" class="mr-0">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="body-2 pa-4">
        <v-form ref="form" @submit.prevent="submit" :disabled="loading">
          <v-checkbox
            v-model="private_.value"
            label="Private"
            hint="If checked, this station will not be shown on the public data explorer"
            persistent-hint
            validate-on-blur
            outlined
            class="mb-4 mt-0"
          ></v-checkbox>
          <v-select
            v-model="organizationId.value"
            :items="organizations"
            :rules="organizationId.rules"
            item-text="code"
            item-value="id"
            label="Organization"
            validate-on-blur
            outlined
          ></v-select>
          <v-text-field
            v-model="code.value"
            :rules="code.rules"
            label="Station Code"
            counter
            :maxlength="code.maxLength"
            hint="A short name or site code for this station (e.g. Browns Brook or BB001). Must be unique within organization."
            persistent-hint
            validate-on-blur
            outlined
            clearable
          ></v-text-field>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="latitude.value"
                :rules="latitude.rules"
                type="number"
                label="Latitude"
                hint="Decimal degrees (e.g. 61.782)"
                persistent-hint
                validate-on-blur
                outlined
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="longitude.value"
                :rules="longitude.rules"
                type="number"
                label="Longitude"
                hint="Decimal degrees (e.g. -150.213)"
                persistent-hint
                validate-on-blur
                outlined
              ></v-text-field>
            </v-col>
          </v-row>
          <v-select
            v-model="timezone.value"
            :items="timezone.options"
            :rules="timezone.rules"
            item-text="label"
            item-value="value"
            label="Time Zone"
            validate-on-blur
            outlined
            clearable
          ></v-select>
          <v-text-field
            v-model="description.value"
            :rules="description.rules"
            label="Description"
            counter
            :maxlength="description.maxLength"
            hint="Description of station location (e.g., Browns Brook Downstream of Rt 1 Bridge)"
            persistent-hint
            validate-on-blur
            outlined
            clearable
          ></v-text-field>
          <v-text-field
            v-model="waterbodyName.value"
            :rules="waterbodyName.rules"
            label="Waterbody Name"
            counter
            :maxlength="waterbodyName.maxLength"
            persistent-hint
            validate-on-blur
            outlined
            clearable
          ></v-text-field>
          <v-select
            v-model="waterbodyType.value"
            :items="waterbodyType.options"
            :rules="waterbodyType.rules"
            item-text="label"
            item-value="value"
            label="Waterbody Type"
            validate-on-blur
            outlined
            clearable
          ></v-select>
          <v-select
            v-model="placement.value"
            :items="placement.options"
            :rules="placement.rules"
            item-text="label"
            item-value="value"
            label="Sensor Placement"
            validate-on-blur
            outlined
            clearable
          ></v-select>
          <v-select
            v-model="mixed.value"
            :items="mixed.options"
            :rules="mixed.rules"
            item-text="label"
            item-value="value"
            label="Is position considered well-mixed?"
            validate-on-blur
            outlined
            clearable
          ></v-select>
          <v-select
            v-model="active.value"
            :items="active.options"
            :rules="active.rules"
            item-text="label"
            item-value="value"
            label="Is station currently active?"
            validate-on-blur
            outlined
            clearable
          ></v-select>
          <v-text-field
            v-model="reference.value"
            :rules="reference.rules"
            label="Reference URL"
            hint="URL to External Data Source (e.g., Inletkeeper, USGS NWIS)"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <Alert type="error" title="Failed to Save Station" v-if="error" class="mt-4 mx-4 mb-0">{{error}}</Alert>

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
  constraints,
  stationTimezoneOptions,
  placementOptions,
  waterbodyTypeOptions,
  booleanOptions
} = require('aktemp-utils/constants')
const { validateStation } = require('aktemp-utils/validators')

export default {
  name: 'ManageStationForm',
  data () {
    return {
      resolve: null,
      reject: null,

      dialog: false,
      loading: false,
      error: null,

      station: null,

      organizationId: {
        value: null,
        rules: [
          v => !!v || 'Organization is required'
        ]
      },
      code: {
        value: '',
        maxLength: constraints.station.code.maxLength,
        rules: [
          v => !!v || 'Code is required',
          v => (!!v && v.trim().length <= constraints.station.code.maxLength) ||
            `Code cannot exceed ${constraints.station.code.maxLength} characters`
        ]
      },
      latitude: {
        value: '',
        rules: [
          v => !!v || 'Latitude is required',
          v => !isNaN(Number(v)) || 'Latitude must be a decimal number',
          v => (Number(v) >= constraints.station.latitude.min &&
                Number(v) <= constraints.station.latitude.max) ||
            `Latitude must be between ${constraints.station.latitude.min} and ${constraints.station.latitude.max}`
        ]
      },
      longitude: {
        value: '',
        rules: [
          v => !!v || 'Longitude is required',
          v => !isNaN(Number(v)) || 'Longitude must be a decimal number',
          v => (Number(v) >= constraints.station.longitude.min &&
                Number(v) <= constraints.station.longitude.max) ||
            `Longitude must be between ${constraints.station.longitude.min} and ${constraints.station.longitude.max}`
        ]
      },
      timezone: {
        value: null,
        options: stationTimezoneOptions,
        rules: [
          v => !!v || 'Timezone is required'
        ]
      },
      description: {
        value: '',
        maxLength: constraints.station.description.maxLength,
        rules: [
          v => !v ||
            (!!v && v.trim().length <= constraints.station.description.maxLength) ||
            `Description cannot exceed ${constraints.station.description.maxLength} characters`
        ]
      },
      placement: {
        value: null,
        options: placementOptions,
        rules: []
      },
      waterbodyName: {
        value: null,
        maxLength: constraints.station.waterbody_name.maxLength,
        rules: [
          v => !v ||
            (!!v && v.trim().length <= constraints.station.waterbody_name.maxLength) ||
            `Name cannot exceed ${constraints.station.waterbody_name.maxLength} characters`
        ]
      },
      waterbodyType: {
        value: null,
        options: waterbodyTypeOptions,
        rules: []
      },
      active: {
        value: null,
        options: booleanOptions,
        rules: []
      },
      mixed: {
        value: null,
        options: booleanOptions,
        rules: []
      },
      reference: {
        value: null,
        rules: []
      },
      private_: {
        value: false,
        rules: []
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      organization: 'manage/organization'
    })
  },
  methods: {
    open (station) {
      this.dialog = true
      this.station = station
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
        organization_id: this.organizationId.value,
        code: this.code.value,
        latitude: this.latitude.value,
        longitude: this.longitude.value,
        timezone: this.timezone.value,
        description: this.description.value,
        waterbody_name: this.waterbodyName.value,
        waterbody_type: this.waterbodyType.value,
        placement: this.placement.value,
        mixed: this.mixed.value,
        active: this.active.value,
        reference: this.reference.value,
        private: this.private_.value
      }

      let payload
      try {
        payload = validateStation(value)
      } catch (err) {
        this.error = err.toString()
        return
      }

      try {
        let response
        if (this.station) {
          response = await this.$http.restricted
            .put(`/organizations/${this.station.organization_id}/stations/${this.station.id}`, payload)
          evt.$emit('notify', `Station (${payload.code}) has been updated`, 'success')
        } else {
          response = await this.$http.restricted
            .post(`/organizations/${payload.organization_id}/stations`, payload)
          evt.$emit('notify', `Station (${payload.code}) has been saved`, 'success')
        }

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

      if (this.station) {
        this.organizationId.value = this.station.organization_id
        this.code.value = this.station.code
        this.description.value = this.station.description
        this.latitude.value = this.station.latitude
        this.longitude.value = this.station.longitude
        this.placement.value = this.station.placement
        this.timezone.value = this.station.timezone
        this.waterbodyName.value = this.station.waterbody_name
        this.waterbodyType.value = this.station.waterbody_type
        this.active.value = this.station.active
        this.mixed.value = this.station.mixed
        this.reference.value = this.station.reference
        this.private_.value = this.station.private
      } else {
        this.organizationId.value = this.organization ? this.organization.id : null
        this.code.value = null
        this.description.value = null
        this.latitude.value = null
        this.longitude.value = null
        this.placement.value = null
        this.timezone.value = null
        this.waterbodyName.value = null
        this.waterbodyType.value = null
        this.active.value = null
        this.mixed.value = null
        this.reference.value = null
        this.private_.value = false
      }
    },
    close () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
