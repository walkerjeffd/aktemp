<template>
  <v-dialog
    v-model="dialog"
    style="z-index:5001"
    scrollable
    @keydown.esc="close"
  >
    <v-card style="width:800px">
      <v-toolbar color="grey lighten-2">
        <v-toolbar-title class="text-h5">
          <span v-if="!station">Create Station</span>
          <span v-else>Edit Station</span>
        </v-toolbar-title>
      </v-toolbar>

      <!-- need to move <v-form> inside <v-card-text> for scrollable dialog to work -->
      <v-card-text class="body-2 py-8 px-4">
        <v-form ref="form" @submit.prevent="submit" :disabled="loading">
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
            maxlength="50"
            hint="A short name or site code for this station (e.g. Browns Brook or BB001)"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
          <v-text-field
            v-model="description.value"
            :rules="description.rules"
            label="Station Description"
            counter
            maxlength="250"
            hint="Description of station (e.g., Browns Brook Downstream of Rt 1 Bridge)"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="latitude.value"
                :rules="latitude.rules"
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
                label="Longitude"
                hint="Decimal degrees (e.g. -150.213)"
                persistent-hint
                validate-on-blur
                outlined
              ></v-text-field>
            </v-col>
          </v-row>
          <v-select
            v-model="placement.value"
            :items="placement.options"
            :rules="placement.rules"
            item-text="label"
            item-value="id"
            label="Sensor Placement"
            validate-on-blur
            outlined
          ></v-select>
          <v-select
            v-model="timezone.value"
            :items="timezone.options"
            :rules="timezone.rules"
            item-text="label"
            item-value="value"
            label="Time Zone"
            validate-on-blur
            outlined
          ></v-select>
          <v-text-field
            v-model="waterbodyName.value"
            :rules="waterbodyName.rules"
            label="Waterbody Name"
            counter
            maxlength="100"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
          <v-select
            v-model="waterbodyType.value"
            :items="waterbodyType.options"
            :rules="waterbodyType.rules"
            item-text="label"
            item-value="id"
            label="Waterbody Type"
            validate-on-blur
            outlined
          ></v-select>
          <v-select
            v-model="mixed.value"
            :items="mixed.options"
            :rules="mixed.rules"
            item-text="label"
            item-value="id"
            label="Is position considered well-mixed?"
            validate-on-blur
            outlined
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
          <v-checkbox
            v-model="active.value"
            label="Active Station"
            validate-on-blur
            outlined
            hide-details
            class="mt-0"
          ></v-checkbox>
          <v-checkbox
            v-model="private_.value"
            label="Private"
            hint="If checked, station will not be shown on the public data explorer"
            persistent-hint
            validate-on-blur
            outlined
          ></v-checkbox>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <Alert type="error" title="Failed to Save Station" v-if="error" class="ma-4">{{error}}</Alert>

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
import { parseBooleanOption, formatBooleanOption, trim } from '@/lib/utils'
import { timezoneOptions, placementOptions, waterbodyTypeOptions, mixedOptions, fieldConstraints } from '@/lib/constants'
import evt from '@/events'

export default {
  name: 'StationForm',
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
        rules: [
          v => !!v || 'Name is required',
          v => (!!v && v.trim().length >= fieldConstraints.station.code.minLength) || `Name must be at least ${fieldConstraints.station.code.minLength} characters`,
          v => (!!v && v.trim().length <= fieldConstraints.station.code.maxLength) || `Name cannot exceed ${fieldConstraints.station.code.maxLength} characters`
        ]
      },
      description: {
        value: '',
        rules: [
          v => !v || (!!v && v.trim().length <= fieldConstraints.station.description.maxLength) || `Description cannot exceed ${fieldConstraints.station.description.maxLength} characters`
        ]
      },
      latitude: {
        value: '',
        rules: [
          v => !!v || 'Latitude is required',
          v => !isNaN(Number(v)) || 'Latitude must be a decimal number',
          v => (Number(v) <= 90 && Number(v) >= -90) || 'Latitude must be between -90 and 90'
        ]
      },
      longitude: {
        value: '',
        rules: [
          v => !!v || 'Longitude is required',
          v => !isNaN(Number(v)) || 'Longitude must be a decimal number',
          v => (Number(v) <= 180 && Number(v) >= -180) || 'Longitude must be between -180 and 180'
        ]
      },
      placement: {
        value: null,
        options: placementOptions,
        rules: [
          v => !!v || 'Placement is required'
        ]
      },
      timezone: {
        value: null,
        options: timezoneOptions,
        rules: [
          v => !!v || 'Timezone is required'
        ]
      },
      waterbodyName: {
        value: null,
        rules: [
          v => !!v || 'Waterbody name is required',
          v => (!!v && v.trim().length <= fieldConstraints.station.waterbodyName.maxLength) || `Name cannot exceed ${fieldConstraints.station.waterbodyName.maxLength} characters`
        ]
      },
      waterbodyType: {
        value: null,
        options: waterbodyTypeOptions,
        rules: [
          v => !!v || 'Waterbody type is required'
        ]
      },
      active: {
        value: true,
        rules: []
      },
      mixed: {
        value: null,
        options: mixedOptions,
        rules: [
          v => !!v || 'Well-mixed conditions is required'
        ]
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
      defaultOrganization: 'manage/organization'
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
      const payload = {
        organization_id: this.organizationId.value,
        code: trim(this.code.value),
        description: trim(this.description.value),
        latitude: this.latitude.value,
        longitude: this.longitude.value,
        placement: this.placement.value,
        timezone: this.timezone.value,
        waterbody_name: trim(this.waterbodyName.value),
        waterbody_type: this.waterbodyType.value,
        mixed: parseBooleanOption(this.mixed.value),
        reference: trim(this.reference.value),
        active: this.active.value,
        private: this.private_.value
      }

      try {
        let response
        if (this.station) {
          response = await this.$http.restricted.put(`/organizations/${this.station.organization_id}/stations/${this.station.id}`, payload)
          evt.$emit('notify', `Station (${payload.code}) has been updated`, 'success')
        } else {
          response = await this.$http.restricted.post(`/organizations/${payload.organization_id}/stations`, payload)
          evt.$emit('notify', `Station (${payload.code}) has been saved`, 'success')
        }

        this.dialog = false
        this.resolve(response.data)
      } catch (err) {
        if (err.response && err.response.data.message) {
          this.error = err.response.data.message
        } else {
          this.err = this.$errorMessage(err)
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
        this.mixed.value = formatBooleanOption(this.station.mixed)
        this.reference.value = this.station.reference
        this.private_.value = this.station.private
      } else {
        this.organizationId.value = this.defaultOrganization ? this.defaultOrganization.id : null
        this.code.value = null
        this.description.value = null
        this.latitude.value = null
        this.longitude.value = null
        this.placement.value = null
        this.timezone.value = timezoneOptions[0].id
        this.waterbodyName.value = null
        this.waterbodyType.value = null
        this.active.value = true
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
