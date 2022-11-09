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

    <v-divider class="mb-4"></v-divider>

    <Alert v-if="downloadStatus.error" type="error" title="Failed to Download Series" class="mx-4">
      {{ downloadStatus.error }}
    </Alert>

    <div class="mx-4 pb-2">
      <div class="my-4">
        <v-btn
          color="primary"
          class="my-4"
          outlined
          block
          download
          :loading="downloadStatus.loading"
          @click="download"
        >
          <v-icon left>mdi-download</v-icon> Download
        </v-btn>
        <v-btn
          color="primary"
          class="my-4"
          outlined
          block
          @click="edit"
        >
          <v-icon left>mdi-pencil</v-icon>
          Edit Series
        </v-btn>
        <v-btn
          color="primary"
          class="my-4"
          outlined
          block
          :to="{
            name: 'manageQaqcSeries',
            params: { seriesId: series.id }
          }"
        >
          <v-icon left>mdi-tools</v-icon>
          QAQC
        </v-btn>
        <v-btn
          color="error"
          class="mt-4"
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
import { rollup, mean, ascending } from 'd3'
import { assignRawFlags } from '@/lib/utils'
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
        loading: false,
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
    async download () {
      this.downloadStatus.loading = true
      this.downloadStatus.error = null

      try {
        const station = await this.$http.restricted.get(`/stations/${this.series.station_id}`)
          .then(d => d.data)

        const values = await this.$http.public
          .get(`/series/${this.series.id}/values`)
          .then(d => d.data)
        const flags = await this.$http.public
          .get(`/series/${this.series.id}/flags`)
          .then(d => d.data)

        const results = assignRawFlags(values, flags)
        const flaggedValues = results.flags.map(flag => {
          return flag.values.map(value => {
            return {
              ...value,
              flag: flag.label
            }
          })
        }).flat()
        // combine overlapping flags
        const groupedFlaggedValues = Array.from(
          rollup(
            flaggedValues,
            v => v,
            d => d.datetime
          ),
          ([key, value]) => ({
            datetime: key,
            temp_c: mean(value.map(d => d.temp_c)),
            flag: value.map(d => d.flag).join(',')
          })
        )
        const outputValues = [results.values, groupedFlaggedValues].flat()
          .sort((a, b) => ascending(a.datetime, b.datetime))
        outputValues.forEach(d => {
          d.series_id = this.series.id
          d.flag = d.flag || ''
        })

        const filename = `AKTEMP-${station.organization_code}-${station.code}-series-${this.series.id}-raw.csv`
        this.$download.seriesRawValues(filename, station, this.series, outputValues)
      } catch (err) {
        console.log(err)
        this.downloadStatus.error = this.$errorMessage(err)
      } finally {
        this.downloadStatus.loading = false
      }
    }
  }
}
</script>
