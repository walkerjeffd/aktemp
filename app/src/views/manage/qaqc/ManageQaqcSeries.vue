<template>
  <!-- eslint-disable vue/valid-v-slot -->
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

    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="error" title="Failed to Load Series" class="mx-8 mt-8" v-else-if="error">{{ error }}</Alert>
    <v-container grid-list-xs v-else-if="series">
      <v-row>
        <v-col cols="12" lg="4" xl="3">
          <StationsMap
            :stations="[station]"
            :station="station"
            style="height:300px"
          ></StationsMap>
          <SeriesInfo :series="series" @refresh="fetch"></SeriesInfo>
        </v-col>
        <v-col cols="12" lg="8" xl="9">
          <v-sheet>
            <v-row>
              <v-col cols="12" xl="7" class="order-last order-xl-first">
                <v-sheet elevation="2">
                  <v-toolbar color="grey lighten-3" flat dense>
                    <div class="text-overline">QAQC Flags</div>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="success"
                      dense
                      small
                      @click="createNewFlag"
                      class="mr-4"
                    ><v-icon small left>mdi-plus</v-icon> New Flag</v-btn>
                    <v-btn
                      color="primary"
                      dense
                      small
                      @click="submit()"
                    ><v-icon small left>mdi-check</v-icon> Done</v-btn>
                  </v-toolbar>
                  <v-divider></v-divider>
                  <v-data-table
                    :value="selectedFlagArray"
                    :loading="loading"
                    :items="series.flags"
                    :headers="table.headers"
                    :sort-by.sync="table.sort.by"
                    :sort-desc.sync="table.sort.desc"
                    @click:row="onClickRow"
                    single-select
                    dense
                    class="row-cursor-pointer"
                  >
                    <template v-slot:item.start_datetime="{ item }">
                      {{ item.start_datetime | timestamp('ff ZZZZ', series.station_timezone) }}
                    </template>
                    <template v-slot:item.end_datetime="{ item }">
                      {{ item.end_datetime | timestamp('ff ZZZZ', series.station_timezone) }}
                    </template>

                    <template v-slot:footer.prepend>
                      <v-btn
                        class="mr-2"
                        color="error"
                        outlined
                        small
                        @click="confirmDeleteAllFlags"
                        :disabled="series.flags.length === 0"
                      ><v-icon small left>mdi-delete</v-icon> Delete All</v-btn>
                      <DownloadButton @click="download" text="Download" small />
                    </template>
                  </v-data-table>
                </v-sheet>
              </v-col>
              <v-col cols="12" xl="5">
                <v-card v-if="showForm">
                  <v-toolbar color="grey lighten-3" flat dense>
                    <div class="text-overline"><span v-if="flag.selected.id === null">New</span><span v-else>Edit</span> Flag</div>
                    <v-spacer></v-spacer>
                  </v-toolbar>
                  <v-form ref="form" @submit.prevent="submit" :disabled="!!flag.loading || submitting">
                    <v-card-text class="black--text">
                      <Alert v-if="!flag.selected.start_datetime" type="warning" class="mb-0" title="Select Period">
                        Click and drag on the chart to select the start and end of the flag period.
                      </Alert>

                      <div v-else class="text-body-1">
                        <div class="body-2 mb-4">
                          Click and drag on the chart to change the flag period.
                        </div>

                        <v-divider></v-divider>

                        <v-simple-table>
                          <tbody>
                            <tr>
                              <td
                                class="text-right grey--text text--darken-2"
                                style="width:30px">
                                Start
                              </td>
                              <td class="font-weight-bold text-left">
                                {{ flag.selected.start_datetime | timestamp('ff ZZZZ', series.station_timezone) }}
                              </td>
                              <td style="width:0">
                                <v-menu
                                  v-model="start.show"
                                  :close-on-content-click="false"
                                  :nudge-width="300"
                                  offset-x
                                >
                                  <template v-slot:activator="{ on, attrs }">
                                    <v-btn
                                      v-bind="attrs"
                                      v-on="on"
                                      small
                                      outlined
                                      class="ml-8"
                                    >
                                      <v-icon left>mdi-pencil</v-icon> Edit
                                    </v-btn>
                                  </template>

                                  <v-card>
                                    <v-card-text>
                                      <v-text-field
                                        v-model="start.value"
                                        placeholder="Start Date/time"
                                        hint="Must be in ISO format ('yyyy-MM-dd HH:mm')"
                                        persistent-hint
                                        :error-messages="start.error"
                                      >
                                      </v-text-field>
                                    </v-card-text>

                                    <v-card-actions>
                                      <v-btn
                                        color="primary"
                                        text
                                        @click="saveStart"
                                      >
                                        Save
                                      </v-btn>
                                      <v-spacer></v-spacer>
                                      <v-btn
                                        text
                                        @click="start.show = false"
                                      >
                                        Cancel
                                      </v-btn>
                                    </v-card-actions>
                                  </v-card>
                                </v-menu>
                              </td>
                            </tr>
                            <tr>
                              <td
                                class="text-right grey--text text--darken-2"
                                style="width:30px">
                                End
                              </td>
                              <td class="font-weight-bold text-left">{{ flag.selected.end_datetime | timestamp('ff ZZZZ', series.station_timezone) }}</td>
                              <td style="width:0">
                                <v-menu
                                  v-model="end.show"
                                  :close-on-content-click="false"
                                  :nudge-width="300"
                                  offset-x
                                >
                                  <template v-slot:activator="{ on, attrs }">
                                    <v-btn
                                      v-bind="attrs"
                                      v-on="on"
                                      small
                                      outlined
                                      class="ml-8"
                                    >
                                      <v-icon left>mdi-pencil</v-icon> Edit
                                    </v-btn>
                                  </template>

                                  <v-card>
                                    <v-card-text>
                                      <v-text-field
                                        v-model="end.value"
                                        placeholder="End Date/time"
                                        hint="Must be in ISO format ('yyyy-MM-dd HH:mm')"
                                        persistent-hint
                                        :error-messages="end.error"
                                      >
                                      </v-text-field>
                                    </v-card-text>

                                    <v-card-actions>
                                      <v-btn
                                        color="primary"
                                        text
                                        @click="saveEnd"
                                      >
                                        Save
                                      </v-btn>
                                      <v-spacer></v-spacer>
                                      <v-btn
                                        text
                                        @click="end.show = false"
                                      >
                                        Cancel
                                      </v-btn>
                                    </v-card-actions>
                                  </v-card>
                                </v-menu>
                              </td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                        <v-divider class="mb-2"></v-divider>

                        <v-row class="mt-4 mb-n4">
                          <v-col cols="12" lg="6">
                            <v-select
                              v-model="flag.selected.flag_type_id"
                              :items="flagTypes"
                              :rules="flag.form.flagType.rules"
                              label="Flag type"
                              placeholder="Select..."
                              item-text="description"
                              item-value="id"
                              outlined
                            ></v-select>
                          </v-col>
                          <v-col cols="12" lg="6">
                            <v-text-field
                              v-if="flag.selected.flag_type_id === 'OTHER'"
                              v-model="flag.selected.flag_type_other"
                              :rules="flag.form.flagTypeOther.rules"
                              label="Describe 'other' flag"
                              outlined
                            ></v-text-field>
                          </v-col>
                        </v-row>
                      </div>

                      <Alert type="error" v-if="flag.error" title="Error Occurred">
                        {{ flag.error }}
                      </Alert>
                    </v-card-text>

                    <v-divider class="mb-2"></v-divider>

                    <v-card-actions class="mx-2 pb-4">
                      <v-btn
                        color="primary"
                        @click="saveFlag"
                        class="mr-2"
                        :disabled="!flag.selected.start_datetime || !!flag.loading"
                        :loading="!!flag.loading && flag.loading !== 'delete'"
                      ><v-icon left>mdi-check</v-icon> Save</v-btn>
                      <v-btn
                        v-if="flag.selected.id !== null"
                        color="error"
                        @click="deleteFlag"
                        class="mr-2"
                        :disabled="!flag.selected.start_datetime || !!flag.loading"
                        :loading="flag.loading === 'delete'"
                      ><v-icon left>mdi-delete</v-icon> Delete</v-btn>
                      <v-spacer></v-spacer>
                      <v-btn text @click="selectFlag()" class="ml-2">Cancel</v-btn>
                    </v-card-actions>
                  </v-form>
                </v-card>
                <Alert v-else type="info" title="QAQC Instructions" class="mb-0 elevation-2">
                  <p class="mt-4">To <b>add a new</b> flag, click the <code>New Flag</code> button.</p>
                  <p>To <b>edit or delete a flag</b>, select it from the table.</p>
                  <p class="mb-0">When finished, click the <code>Done</code> button to <b>mark timeseries as reviewed</b>.</p>
                </Alert>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-sheet elevation="2" class="px-4">
                  <div class="d-flex align-center px-4 pt-4">
                    <v-spacer></v-spacer>
                    <div class="mr-2 text-overline">Chart Mode:</div>
                    <v-btn-toggle
                      v-model="chartMode"
                      dense
                      mandatory
                    >
                      <v-btn :disabled="!showForm" value="zoom">
                        <v-icon left>mdi-magnify</v-icon> Zoom
                      </v-btn>
                      <v-btn :disabled="!showForm" value="brush">
                        <v-icon left>mdi-select-compare</v-icon> Select
                      </v-btn>
                    </v-btn-toggle>
                  </div>
                  <SeriesChart
                    :series="seriesArray"
                    :flags="series.flags"
                    :flag="flag.selected"
                    :brush="chartMode === 'brush'"
                    @brush="setRange"
                    @select="selectFlag"
                    class="elevation-0 py-2 pr-2"
                  ></SeriesChart>
                </v-sheet>
              </v-col>
            </v-row>
          </v-sheet>
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
          All flags for this timeseries will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-card>
</template>

<script>
// import { flagTypeOptions } from '@/lib/constants'
import StationsMap from '@/components/StationsMap'
import SeriesInfo from '@/components/series/SeriesInfo'
import SeriesChart from '@/components/series/SeriesChart'
import { mapGetters } from 'vuex'

export default {
  name: 'ManageQaqcSeries',
  components: {
    StationsMap,
    SeriesInfo,
    SeriesChart
  },
  data () {
    return {
      loading: true,
      submitting: false,
      error: null,
      chartLoading: false,
      showForm: false,
      chartMode: 'zoom',
      series: null,
      station: null,
      start: {
        show: false,
        value: null,
        error: null
      },
      end: {
        show: false,
        value: null,
        error: null
      },
      flag: {
        loading: false,
        error: null,
        selected: {
          id: null,
          start_datetime: null,
          end_datetime: null,
          flag_type_id: null,
          flag_type_other: null
        },
        form: {
          flagType: {
            // options: flagTypeOptions,
            rules: [
              v => !!v || 'Flag type is required'
            ]
          },
          flagTypeOther: {
            rules: []
          }
        }
      },
      table: {
        sort: {
          by: 'start_datetime',
          desc: false
        },
        headers: [
          {
            text: 'Start',
            value: 'start_datetime'
          },
          {
            text: 'End',
            value: 'end_datetime'
          },
          {
            text: 'Flag',
            value: 'flag_type_id'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization',
      flagTypes: 'manage/flagTypes'
    }),
    selectedFlagArray () {
      return this.flag.selected ? [this.flag.selected] : []
    },
    seriesArray () {
      console.log('seriesArray')
      return [this.series]
    }
  },
  watch: {
    '$route.params' () {
      this.showForm = false
      this.resetForm()
      this.fetch()
      this.chartMode = 'zoom'
    },
    'start.show' () {
      if (this.start.show) {
        this.openStart()
      }
    },
    'end.show' () {
      if (this.end.show) {
        this.openEnd()
      }
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      console.log('series:fetch')
      this.loading = true
      this.error = null
      try {
        const series = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}`)
          .then(d => d.data)
        if (series.organization_id !== this.organization.id) {
          return this.$router.push({
            name: 'manageQaqc'
          })
        }
        series.flags.forEach(f => {
          f.start_datetime = this.$luxon.DateTime.fromISO(f.start_datetime, { zone: series.station_timezone })
          f.end_datetime = this.$luxon.DateTime.fromISO(f.end_datetime, { zone: series.station_timezone })
        })
        this.station = await this.$http.restricted.get(`/stations/${series.station_id}`)
          .then(d => d.data)
        // this.series.flags = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/flags`)
        //   .then(d => d.data)
        this.series = series
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
        this.$vuetify.goTo(document.body.scrollHeight)
      }
    },
    async setRange (start, end) {
      if (this.showForm) {
        this.flag.selected.start_datetime = start
        this.flag.selected.end_datetime = end
      }
    },
    async saveFlag () {
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
        start_datetime: this.flag.selected.start_datetime.toISO(),
        end_datetime: this.flag.selected.end_datetime.toISO(),
        flag_type_id: this.flag.selected.flag_type_id,
        flag_type_other: this.flag.selected.flag_type_other
      }
      if (this.flag.selected.id !== null) {
        payload.id = this.flag.selected.id
      }
      try {
        if (payload.id === undefined) {
          await this.$http.restricted
            .post(`/series/${this.$route.params.seriesId}/flags`, payload)
        } else {
          await this.$http.restricted
            .put(`/series/${this.$route.params.seriesId}/flags/${payload.id}`, payload)
        }
        this.series.flags = await this.$http.restricted
          .get(`/series/${this.$route.params.seriesId}/flags`)
          .then(d => d.data)
        this.series.flags.forEach(f => {
          f.start_datetime = this.$luxon.DateTime.fromISO(f.start_datetime, { zone: this.series.station_timezone })
          f.end_datetime = this.$luxon.DateTime.fromISO(f.end_datetime, { zone: this.series.station_timezone })
        })
        this.selectFlag()
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
        this.series.flags = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/flags`)
          .then(d => d.data)
        this.selectFlag()
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
        this.series.flags = []
        this.selectFlag()
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.chartLoading = false
      }
    },
    async resetForm () {
      this.flag.loading = false
      this.flag.error = null
      this.flag.selected = {
        id: null,
        start_datetime: null,
        end_datetime: null,
        flag_type_id: null,
        flag_type_other: null
      }
    },
    async submit () {
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
    async onClickRow (row) {
      this.selectFlag(row)
    },
    async selectFlag (flag) {
      console.log('selectFlag', flag)
      if (!flag || (this.flag.selected && this.flag.selected.id === flag.id)) {
        this.flag.selected = null
        this.showForm = false
        this.chartMode = 'zoom'
      } else if (flag) {
        this.showForm = true
        this.chartMode = 'brush'
        this.flag.selected = { ...flag }
      }
    },
    createNewFlag () {
      console.log('createNewFlag()')
      this.resetForm()
      this.showForm = true
      this.chartMode = 'brush'
    },
    openStart () {
      if (this.flag.selected && this.flag.selected.start_datetime) {
        this.start.value = this.$luxon.DateTime.fromISO(this.flag.selected.start_datetime, {
          zone: this.series.station_timezone
        }).toFormat('yyyy-MM-dd HH:mm')
      } else {
        this.start.value = null
      }
      this.start.error = null
    },
    saveStart () {
      const startDatetime = this.$luxon.DateTime.fromFormat(this.start.value, 'yyyy-MM-dd H:mm', {
        zone: this.series.station_timezone
      })
      if (!startDatetime.isValid) {
        this.start.error = 'Failed to parse date/time using ISO format (\'yyyy-MM-dd HH:mm\')'
        return
      }
      this.flag.selected.start_datetime = startDatetime
      this.start.show = false
    },
    openEnd () {
      if (this.flag.selected && this.flag.selected.end_datetime) {
        this.end.value = this.$luxon.DateTime.fromISO(this.flag.selected.end_datetime, {
          zone: this.series.station_timezone
        }).toFormat('yyyy-MM-dd HH:mm')
      } else {
        this.end.value = null
      }
      this.end.error = null
    },
    saveEnd () {
      const endDatetime = this.$luxon.DateTime.fromFormat(this.end.value, 'yyyy-MM-dd H:mm', {
        zone: this.series.station_timezone
      })
      if (!endDatetime.isValid) {
        this.end.error = 'Failed to parse date/time using ISO format (\'yyyy-MM-dd HH:mm\')'
        return
      }
      this.flag.selected.end_datetime = endDatetime
      this.end.show = false
    },
    download () {
      const filename = `AKTEMP-${this.station.organization_code}-${this.station.code}-series-${this.series.id}-flags.csv`
      this.$download.flags(filename, this.station, this.series, this.series.flags)
    }
  }
}
</script>
