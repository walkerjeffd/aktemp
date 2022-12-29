<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="800"
    @keydown.esc="close"
    style="z-index:4000"
  >
    <v-card>
      <v-toolbar flat dense color="grey lighten-2">
        <v-toolbar-title class="text-h6">
          Edit Timeseries Metadata
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
            v-model="interval.value"
            :items="interval.options"
            :rules="interval.rules"
            item-text="label"
            item-value="value"
            label="Interval"
            validate-on-blur
            outlined
          ></v-select>
          <div v-if="interval.value === 'CONTINUOUS'">
            <v-text-field
              v-model="frequency.value"
              :items="frequency.options"
              :rules="frequency.rules"
              item-text="label"
              item-value="value"
              label="Frequency (min)"
              validate-on-blur
              outlined
              type="number"
              clearable
            ></v-text-field>
            <v-text-field
              v-model="depthValue.value"
              :items="depthValue.options"
              :rules="depthValue.rules"
              item-text="label"
              item-value="value"
              label="Depth (m)"
              validate-on-blur
              outlined
              type="number"
              clearable
            ></v-text-field>
            <v-select
              v-model="depthCategory.value"
              :items="depthCategory.options"
              :rules="depthCategory.rules"
              item-text="label"
              item-value="value"
              label="Depth Category"
              validate-on-blur
              outlined
              clearable
            ></v-select>
            <v-select
              v-model="sopBath.value"
              :items="sopBath.options"
              :rules="sopBath.rules"
              item-text="label"
              item-value="value"
              label="Was logger checked with pre/post deployment bath according to SOP?"
              validate-on-blur
              outlined
              clearable
            ></v-select>
          </div>
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
            label="Has timeseries undergone QAQC review?"
            validate-on-blur
            outlined
            clearable
          ></v-select>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <Alert type="error" title="Failed to Save Timeseries Metadata" v-if="error" class="mt-4 mx-4 mb-0">{{error}}</Alert>

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
  depthCategoryOptions,
  sensorAccuracyOptions,
  intervalOptions
} = require('aktemp-utils/constants')
const { validateSeries } = require('aktemp-utils/validators')

export default {
  name: 'ManageSeriesEditForm',
  data () {
    return {
      resolve: null,
      reject: null,

      dialog: false,
      loading: false,
      error: null,

      series: null,

      station: {
        value: null,
        rules: [
          v => !!v || 'Station is required'
        ]
      },
      depthValue: {
        value: null,
        rules: [
        ]
      },
      depthCategory: {
        value: null,
        options: depthCategoryOptions,
        rules: []
      },
      interval: {
        value: null,
        options: intervalOptions,
        rules: [
          v => !!v || 'Interval is required'
        ]
      },
      frequency: {
        value: null,
        rules: []
      },
      sopBath: {
        value: null,
        options: booleanOptions,
        rules: []
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
    open (series) {
      this.dialog = true
      this.series = series
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
        interval: this.interval.value,
        station_id: this.station.value,
        accuracy: this.accuracy.value,
        reviewed: this.reviewed.value
      }
      if (value.interval === 'CONTINUOUS') {
        value.depth_m = this.depthValue.value
        value.depth_category = this.depthCategory.value
        value.frequency = this.frequency.value
        value.sop_bath = this.sopBath.value
      }

      let payload
      try {
        payload = validateSeries(value, this.stations)
      } catch (err) {
        this.error = err.toString()
        this.loading = false
        return
      }

      try {
        const response = await this.$http.restricted
          .put(`/series/${this.series.id}`, payload)
        evt.$emit('notify', `Series (id=${this.series.id}) has been updated`, 'success')

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

      if (this.series) {
        this.station.value = this.series.station_id
        this.depthValue.value = this.series.depth_m
        this.depthCategory.value = this.series.depth_category
        this.interval.value = this.series.interval
        this.frequency.value = this.series.frequency
        this.accuracy.value = this.series.accuracy
        this.sopBath.value = this.series.sop_bath
        this.reviewed.value = this.series.reviewed
      } else {
        this.station.value = null
        this.depthValue.value = null
        this.depthCategory.value = null
        this.interval.value = null
        this.frequency.value = null
        this.accuracy.value = null
        this.sopBath.value = null
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
