<template>
  <v-card elevation="4" class="pb-4">
    <v-toolbar dense flat color="grey lighten-3" height="40px">
      <v-toolbar-title>
        <span class="text-overline">Selected Timeseries</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon x-small @click="$router.push({ name: 'manageQaqc' })" class="mr-0">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <Loading v-if="loading"></Loading>
    <Alert type="error" title="Failed to Load Series" class="mx-8 mt-8" v-else-if="error">{{ error }}</Alert>
    <v-container grid-list-xs v-else-if="series">
      <v-row>
        <v-col cols="12" lg="4" xl="3">
          <StationsMap
            :stations="[station]"
            :station="station"
            style="height:300px"
          ></StationsMap>
          <SeriesInfo :series="series"></SeriesInfo>
        </v-col>
        <v-col cols="12" lg="8" xl="9">
          <v-card>
            <v-card-text>
              <ManageQaqcSeriesChart
                :series="series"
                :flags="flags"
                :flag="flag.selected"
                :zoom="mode === 'zoom'"
                :chart-loading="chartLoading"
                @select="onSelect"
                @click-flag="clickFlag"
              ></ManageQaqcSeriesChart>
              <v-row class="mt-4">
                <v-col cols="12" xl="6">
                  <v-card v-if="mode === 'create' || mode === 'edit'">
                    <v-form ref="form" @submit.prevent="submit" :disabled="!!flag.loading || submitting">
                      <v-card-text class="black--text">
                        <div class="font-weight-bold text-h6 mb-4">
                          <span v-if="mode === 'create'">New</span><span v-else>Edit</span> Flag
                        </div>

                        <Alert v-if="mode === 'create' && !flag.selected.start_datetime" type="info" title="Define Flag Period" class="mb-0">
                          Click and drag on the chart above to define the start and end of the flag period.
                        </Alert>
                        <Alert v-else-if="mode === 'edit' && !flag.selected.start_datetime" type="info" title="Select Flag" class="mb-0">
                          Click on a flagged period in the chart above to select it.
                        </Alert>

                        <div v-else class="text-body-1">
                          <div>
                            Start: <strong>{{ flag.selected.start_datetime | timestampTimezoneFormat(series.station_timezone, 'lll z')}}</strong>
                          </div>
                          <div>
                            End: <strong>{{ flag.selected.end_datetime | timestampTimezoneFormat(series.station_timezone, 'lll z')}}</strong>
                          </div>

                          <div class="text--secondary caption">
                            <v-icon x-small>mdi-information</v-icon> Click and drag on the chart to change the flag period.
                          </div>

                          <v-select
                            v-model="flag.selected.flagType.selected"
                            :items="flag.selected.flagType.options"
                            :rules="flag.selected.flagType.rules"
                            label="Select flag type"
                            item-text="description"
                            item-value="id"
                            return-object
                            class="mt-4"
                          ></v-select>
                          <v-text-field
                            v-if="flag.selected.flagType.selected && flag.selected.flagType.selected.id === 'OTHER'"
                            v-model="flag.selected.flagTypeOther.value"
                            :rules="flag.selected.flagTypeOther.rules"
                            label="Describe 'other' flag"
                          ></v-text-field>
                        </div>

                        <Alert type="error" v-if="flag.error" title="Error Occurred">
                          {{ flag.error }}
                        </Alert>
                      </v-card-text>

                      <v-card-actions class="mx-2 pb-4">
                        <v-btn
                          color="primary"
                          @click="saveFlag"
                          class="mr-2"
                          :disabled="!flag.selected.start_datetime || !!flag.loading"
                          :loading="!!flag.loading && flag.loading !== 'delete'"
                        ><v-icon left>mdi-check</v-icon> Save</v-btn>
                        <v-btn
                          v-if="mode === 'edit'"
                          color="error"
                          @click="deleteFlag"
                          class="mr-2"
                          :disabled="!flag.selected.start_datetime || !!flag.loading"
                          :loading="flag.loading === 'delete'"
                        ><v-icon left>mdi-delete</v-icon> Delete</v-btn>
                        <v-spacer></v-spacer>
                        <v-btn color="default" @click="setMode('zoom')" class="ml-2">Cancel</v-btn>
                      </v-card-actions>
                    </v-form>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="mx-2 py-4">
              <v-btn
                class="mr-2"
                :depressed="mode === 'create'"
                color="success"
                @click="setMode('create')"
              ><v-icon small left>mdi-plus</v-icon> New Flag</v-btn>
              <v-btn
                class="mx-2"
                :depressed="mode === 'edit'"
                color="info"
                @click="setMode('edit')"
              ><v-icon small left>mdi-pencil</v-icon> Edit Flag</v-btn>
              <v-btn
                class="ml-2"
                color="error"
                @click="confirmDeleteAllFlags"
              ><v-icon small left>mdi-pencil</v-icon> Delete All</v-btn>
              <v-spacer></v-spacer>
              <v-btn
                class="mr-2"
                color="primary"
                @click="submit"
                :loading="submitting"
              >Done</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <ConfirmDialog ref="confirmDeleteAll">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          All flags will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-card>
</template>

<script>
import { flagTypeOptions } from '@/lib/constants'
import StationsMap from '@/components/StationsMap'
import SeriesInfo from '@/components/series/SeriesInfo'
import ManageQaqcSeriesChart from '@/views/manage/qaqc/components/ManageQaqcSeriesChart'

export default {
  name: 'ManageQaqcSeries',
  components: {
    StationsMap,
    SeriesInfo,
    ManageQaqcSeriesChart
  },
  data () {
    return {
      loading: true,
      submitting: false,
      error: null,
      chartLoading: false,
      mode: 'zoom',
      series: null,
      station: null,
      flag: {
        loading: false,
        error: null,
        selected: {
          id: null,
          start_datetime: null,
          end_datetime: null,
          flagType: {
            selected: null,
            options: flagTypeOptions,
            rules: [
              v => !!v || 'Flag type is required'
            ]
          },
          flagTypeOther: {
            value: null,
            rules: []
          }
        }
      },
      flags: []
    }
  },
  watch: {
    '$route.params.seriesId' () {
      this.fetch()
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      console.log(`fetch(${this.$route.params.seriesId})`)
      this.loading = true
      this.error = null
      try {
        this.series = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}`)
          .then(d => d.data)
        this.station = await this.$http.restricted.get(`/stations/${this.series.station_id}`)
          .then(d => d.data)
        this.flags = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/flags`)
          .then(d => d.data)
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
        this.$vuetify.goTo(document.body.scrollHeight)
      }
    },
    async onSelect (start, end) {
      this.flag.selected.start_datetime = start
      this.flag.selected.end_datetime = end
    },
    async saveFlag () {
      // console.log('saveFlag', start.toString(), end.toString())
      this.flag.error = null

      if (!this.flag.selected.start_datetime || !this.flag.selected.end_datetime) {
        this.flag.error = 'Flag period not defined. Click and drag on the chart above to define the period.'
        return
      }

      if (!this.$refs.form.validate()) {
        return
      }

      this.flag.loading = true
      this.chartLoading = true
      const payload = {
        start_datetime: this.flag.selected.start_datetime,
        end_datetime: this.flag.selected.end_datetime,
        flag_type_id: this.flag.selected.flagType.selected.id,
        flag_type_other: this.flag.selected.flagType.selected.id === 'OTHER'
          ? this.flag.selected.flagTypeOther.value
          : null
      }
      try {
        if (this.mode === 'create') {
          await this.$http.restricted.post(`/series/${this.$route.params.seriesId}/flags`, payload)
        } else if (this.mode === 'edit') {
          payload.id = this.flag.selected.id
          await this.$http.restricted.put(`/series/${this.$route.params.seriesId}/flags/${payload.id}`, payload)
        }
        this.flags = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/flags`)
          .then(d => d.data)
        this.setMode('zoom')
      } catch (err) {
        this.flag.error = this.$errorMessage(err)
      } finally {
        this.chartLoading = false
        this.flag.loading = false
      }
    },
    async deleteFlag () {
      this.flag.error = null

      this.flag.loading = 'delete'
      this.chartLoading = true
      const id = this.flag.selected.id
      if (!id) {
        this.flag.error = 'An existing flag is not currently selected'
      }
      try {
        await this.$http.restricted.delete(`/series/${this.$route.params.seriesId}/flags/${id}`)
        this.flags = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/flags`)
          .then(d => d.data)
        this.setMode('zoom')
      } catch (err) {
        this.flag.error = this.$errorMessage(err)
      } finally {
        this.chartLoading = false
        this.flag.loading = false
      }
    },
    async confirmDeleteAllFlags () {
      const ok = await this.$refs.confirmDeleteAll.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteAllFlags()
      }
    },
    async deleteAllFlags () {
      this.chartLoading = true
      try {
        await this.$http.restricted.delete(`/series/${this.$route.params.seriesId}/flags`)
        this.flags = []
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.chartLoading = false
      }
    },
    async resetFlag () {
      this.flag.loading = false
      this.flag.error = null
      this.flag.selected.id = null
      this.flag.selected.start_datetime = null
      this.flag.selected.end_datetime = null
      this.flag.selected.flagType.selected = null
      this.flag.selected.flagTypeOther.value = null
    },
    async submit () {
      console.log('submit (mark as reviewed and go to next)')
      this.error = null
      this.submitting = true

      try {
        await this.$http.restricted.put(`/series/${this.$route.params.seriesId}`, { reviewed: true })
        this.$router.push({ name: 'manageQaqc', params: { refresh: true } })
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.submitting = false
      }
    },
    async clickFlag (flag) {
      if (this.mode === 'edit') {
        this.flag.selected.id = flag.id
        this.flag.selected.start_datetime = flag.start_datetime
        this.flag.selected.end_datetime = flag.end_datetime
        this.flag.selected.flagType.selected = this.flag.selected.flagType.options.find(d => d.id === flag.flag_type_id)
        this.flag.selected.flagTypeOther.value = flag.flag_type_other
      }
    },
    setMode (mode) {
      if (this.mode === 'create' || this.mode === 'edit') {
        this.resetFlag()
      }
      this.mode = mode
    }
  }
}
</script>
