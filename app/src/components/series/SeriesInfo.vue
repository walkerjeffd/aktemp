<template>
  <v-sheet elevation="2">
    <v-simple-table dense>
      <tbody>
        <tr>
          <td class="text-right grey--text text--darken-2" style="width:100px">
            Series ID
          </td>
          <td class="font-weight-bold">{{ series.id }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Organization
          </td>
          <td class="font-weight-bold">{{ series.organization_code }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Station
          </td>
          <td class="font-weight-bold">
            <router-link :to="{
              name: 'manageStation',
              params: {
                stationId: series.station_id
              }
            }">
              {{ series.station_code }}
            </router-link>
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            File
          </td>
          <td class="font-weight-bold">
            <router-link :to="{
              name: 'manageFile',
              params: {
                fileId: series.file_id
              }
            }">
              {{ series.file_filename }}
            </router-link>
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Start
          </td>
          <td class="font-weight-bold">{{ series.start_datetime | timestamp('ff ZZZZ', series.station_timezone) }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            End
          </td>
          <td class="font-weight-bold">{{ series.end_datetime | timestamp('ff ZZZZ', series.station_timezone) }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Interval
          </td>
          <td class="font-weight-bold">{{ series.interval }}</td>
        </tr>
        <tr v-if="series.interval === 'CONTINUOUS'">
          <td class="text-right grey--text text--darken-2">
            Frequency
          </td>
          <td class="font-weight-bold">{{ series.frequency ? `${series.frequency} min` : '' }}</td>
        </tr>
        <tr v-if="series.interval === 'CONTINUOUS'">
          <td class="text-right grey--text text--darken-2">
            Depth Cat.
          </td>
          <td class="font-weight-bold">{{ series.depth_category }}</td>
        </tr>
        <tr v-if="series.interval === 'CONTINUOUS'">
          <td class="text-right grey--text text--darken-2">
            Depth (m)
          </td>
          <td class="font-weight-bold">{{ series.depth_m }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Accuracy
          </td>
          <td class="font-weight-bold">{{ series.accuracy | accuracy }}</td>
        </tr>
        <tr v-if="series.interval === 'CONTINUOUS'">
          <td class="text-right grey--text text--darken-2">
            SOP Bath
          </td>
          <td class="font-weight-bold">
            <Checkbox :value="series.sop_bath"></Checkbox>
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Reviewed
          </td>
          <td class="font-weight-bold">
            <Checkbox :value="series.reviewed"></Checkbox>
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-divider class="mb-2"></v-divider>

    <div class="mx-4">
      <div class="mb-2 d-flex justify-space-between" v-if="series.interval === 'CONTINUOUS'">
        <v-btn
          color="primary"
          outlined
          download
          :loading="downloadStatus.loading.raw"
          @click="downloadRaw"
        >
          <v-icon left>mdi-download</v-icon> Raw
        </v-btn>
        <v-btn
          color="primary"
          outlined
          download
          :loading="downloadStatus.loading.daily"
          @click="downloadDaily"
        >
          <v-icon left>mdi-download</v-icon> Daily
        </v-btn>
        <v-btn
          color="primary"
          outlined
          download
          :loading="downloadStatus.loading.flags"
          @click="downloadFlags"
        >
          <v-icon left>mdi-download</v-icon> Flags
        </v-btn>
      </div>
      <div class="mb-2 d-flex justify-space-between" v-else-if="series.interval === 'DISCRETE'">
        <v-btn
          color="primary"
          outlined
          download
          :loading="downloadStatus.loading.discrete"
          @click="downloadDiscrete"
        >
          <v-icon left>mdi-download</v-icon> Raw
        </v-btn>
        <v-btn
          color="primary"
          outlined
          download
          :loading="downloadStatus.loading.flags"
          @click="downloadFlags"
        >
          <v-icon left>mdi-download</v-icon> Flags
        </v-btn>
      </div>

      <Alert v-if="downloadStatus.error" type="error" title="Download Failed">
        {{ downloadStatus.error }}
      </Alert>
    </div>
    <v-divider class="my-2"></v-divider>
    <div class="mx-4">
      <div class="mt-2 mb-2 d-flex justify-space-between">
        <v-btn
          color="success"
          outlined
          @click="edit"
        >
          <v-icon left>mdi-pencil</v-icon>
          Edit
        </v-btn>
        <v-btn
          color="success"
          outlined
          :to="{
            name: 'manageQaqcSeries',
            params: { seriesId: series.id }
          }"
        >
          <v-icon left>mdi-tools</v-icon>
          QAQC
        </v-btn>
      </div>
    </div>
    <v-divider class="my-2"></v-divider>
    <div class="mx-4 pb-2">
      <div>
        <v-btn
          color="error"
          outlined
          block
          @click="confirmDelete"
          :loading="deleteStatus.loading"
        >
          <v-icon left>mdi-delete</v-icon>
          Delete Series
        </v-btn>
      </div>
      <Alert type="error" title="Error Occurred" v-if="deleteStatus.error">{{ deleteStatus.error }}</Alert>
    </div>

    <ManageSeriesEditForm ref="form"></ManageSeriesEditForm>

    <ConfirmDialog ref="confirmDelete">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          This timeseries and all its data will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-sheet>
</template>

<script>
// import { rollup, mean, ascending } from 'd3'
import { assignFlags } from 'aktemp-utils/flags'
import { writeSeriesRawFile, writeSeriesDailyFile, writeSeriesDiscreteFile, writeSeriesFlagsFile } from 'aktemp-utils/downloads'

import ManageSeriesEditForm from '@/views/manage/series/ManageSeriesEditForm'

export default {
  name: 'SeriesInfo',
  props: ['series'],
  components: { ManageSeriesEditForm },
  data () {
    return {
      deleteStatus: {
        loading: false,
        error: null
      },
      downloadStatus: {
        loading: {
          raw: false,
          daily: false,
          discrete: false,
          flags: false
        },
        error: null
      }
    }
  },
  methods: {
    async edit () {
      const series = await this.$refs.form.open(this.series)
      if (series) {
        this.$emit('refresh')
      }
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.delete()
      }
    },
    async delete () {
      this.deleteStatus.loading = true
      this.deleteStatus.error = null
      try {
        await this.$http.restricted.delete(`/series/${this.series.id}`)
        this.$emit('delete')
      } catch (err) {
        console.error(err)
        this.deleteStatus.error = err.toString() || 'Unknown error'
      } finally {
        this.deleteStatus.loading = false
      }
    },
    async downloadRaw () {
      this.downloadStatus.loading.raw = true
      this.downloadStatus.error = null

      try {
        let values = await this.$http.public
          .get(`/series/${this.series.id}/values`)
          .then(d => d.data)
        values.forEach(d => {
          d.datetime = new Date(d.datetime)
        })
        const flags = await this.$http.public
          .get(`/series/${this.series.id}/flags`)
          .then(d => d.data)
        flags.forEach(d => {
          d.start_datetime = new Date(d.start_datetime)
          d.end_datetime = new Date(d.end_datetime)
        })
        values = assignFlags(values, flags)

        const body = writeSeriesRawFile(this.series, values, flags)
        const filename = `AKTEMP-${this.series.organization_code}-${this.series.station_code}-series-${this.series.id}-raw.csv`
        this.$download(body, filename)
      } catch (err) {
        console.log(err)
        this.downloadStatus.error = this.$errorMessage(err)
      } finally {
        this.downloadStatus.loading.raw = false
      }
    },
    async downloadDaily () {
      this.downloadStatus.loading.daily = true
      this.downloadStatus.error = null

      try {
        const body = writeSeriesDailyFile([this.series])
        const filename = `AKTEMP-${this.series.organization_code}-${this.series.station_code}-series-${this.series.id}-daily.csv`
        this.$download(body, filename)
      } catch (err) {
        console.log(err)
        this.downloadStatus.error = this.$errorMessage(err)
      } finally {
        this.downloadStatus.loading.daily = false
      }
    },
    async downloadDiscrete () {
      this.downloadStatus.loading.discrete = true
      this.downloadStatus.error = null

      try {
        const body = writeSeriesDiscreteFile([this.series])
        const filename = `AKTEMP-${this.series.organization_code}-${this.series.station_code}-series-${this.series.id}-discrete.csv`
        this.$download(body, filename)
      } catch (err) {
        console.log(err)
        this.downloadStatus.error = this.$errorMessage(err)
      } finally {
        this.downloadStatus.loading.discrete = false
      }
    },
    async downloadFlags () {
      this.downloadStatus.loading.flags = true
      this.downloadStatus.error = null

      try {
        const body = writeSeriesFlagsFile([this.series])
        const filename = `AKTEMP-${this.series.organization_code}-${this.series.station_code}-series-${this.series.id}-flags.csv`
        this.$download(body, filename)
      } catch (err) {
        console.log(err)
        this.downloadStatus.error = this.$errorMessage(err)
      } finally {
        this.downloadStatus.loading.flags = false
      }
    }
  }
}
</script>
