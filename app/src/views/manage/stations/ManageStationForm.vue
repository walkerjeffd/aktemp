<template>
  <v-dialog
    v-model="dialog"
    :max-width="1000"
    style="z-index:5001"
    @keydown.esc="close"
  >
    <v-card>
      <v-toolbar color="grey lighten-2">
        <v-toolbar-title class="text-h5">
          <span v-if="!station">Create Station</span>
          <span v-else>Edit Station</span>
        </v-toolbar-title>
      </v-toolbar>

      <!-- need to move <v-form> inside <v-card-text> for scrollable dialog to work -->
      <v-form ref="form" @submit.prevent="submit">
        <v-card-text class="body-2 py-8 px-4">
          <v-select
            v-model="organizationId.value"
            :items="organizationId.options"
            :rules="organizationId.rules"
            item-text="id"
            item-value="id"
            label="Organization ID"
            validate-on-blur
            outlined
          ></v-select>
          <v-text-field
            v-model="code.value"
            :rules="code.rules"
            label="Station Code"
            counter
            maxlength="50"
            hint="A short name or site code for this station (e.g. Brown's Brook or BB001)"
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
            item-value="id"
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
            hide-details
          ></v-select>
          <v-checkbox
            v-model="active.value"
            label="Active"
            validate-on-blur
            outlined
          ></v-checkbox>
          <v-select
            v-model="mixed.value"
            :items="mixed.options"
            :rules="mixed.rules"
            item-text="label"
            item-value="id"
            label="Mixed"
            validate-on-blur
            outlined
            hide-details
          ></v-select>
          <v-checkbox
            v-model="private_.value"
            label="Private"
            hint="If checked, station will not be shown on data explorer"
            persistent-hint
            validate-on-blur
            outlined
          ></v-checkbox>

          <v-alert
            type="error"
            text
            colored-border
            border="left"
            class="body-2 mb-0 mt-8"
            v-if="error">
            <div class="body-1 font-weight-bold">Failed to Create Station</div>
            <div>{{ error }}</div>
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-btn
            type="submit"
            color="primary"
            class="mr-4"
            :loading="loading">submit</v-btn>
          <v-btn text @click="reset">reset</v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="close">cancel</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { timezoneOptions, placementOptions, waterbodyTypeOptions, mixedOptions } from '@/lib/constants'

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
        options: [],
        // options: this.user.organizations,
        rules: [
          v => !!v || 'Organization is required'
        ]
      },
      code: {
        value: '',
        rules: [
          v => !!v || 'Name is required',
          v => (!!v && v.trim().length >= 4) || 'Name must be at least 4 characters',
          v => (!!v && v.trim().length <= 50) || 'Name cannot exceed 50 characters'
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
          v => (!!v && v.trim().length <= 50) || 'Name cannot exceed 50 characters'
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
    ...mapGetters(['user', 'organizations'])
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

      if (!this.$refs.form.validate()) return

      this.loading = true
      const organizationId = this.organizationId.value
      const payload = {
        code: this.code.value,
        latitude: this.latitude.value,
        longitude: this.longitude.value,
        placement: this.placement.value,
        timezone: this.timezone.value,
        waterbody_name: this.waterbodyName.value,
        waterbody_type: this.waterbodyType.value,
        active: !!this.active.value,
        mixed: this.mixed.value,
        reference: this.reference.value,
        private: !!this.private_.value
      }

      try {
        let response
        if (this.station) {
          response = await this.$http.restricted.put(`/organizations/${organizationId}/stations/${this.station.id}`, payload)
        } else {
          response = await this.$http.restricted.post(`/organizations/${organizationId}/stations`, payload)
        }

        this.dialog = false
        this.resolve(response.data)
      } catch (err) {
        if (err.response && err.response.data.message) {
          this.error = err.response.data.message
        } else {
          this.error = err.message || err.toString()
        }
      } finally {
        this.loading = false
      }
    },
    reset () {
      if (!this.$refs.form) return
      this.$refs.form.resetValidation()
      this.loading = false
      this.error = null

      this.organizationId.options = this.organizations

      if (this.station) {
        this.organizationId.value = this.station.organization_id
        this.code.value = this.station.code
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
        this.organizationId.value = this.organizationId.options[0].id
        this.code.value = null
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
