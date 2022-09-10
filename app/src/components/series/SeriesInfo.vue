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
          <td class="font-weight-bold">{{ series.start_datetime | timestampTimezoneFormat(series.station_timezone, 'lll z') }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            End
          </td>
          <td class="font-weight-bold">{{ series.end_datetime | timestampTimezoneFormat(series.station_timezone, 'lll z') }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Depth
          </td>
          <td class="font-weight-bold">{{ series | seriesDepth }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Interval
          </td>
          <td class="font-weight-bold">{{ series.interval }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Frequency
          </td>
          <td class="font-weight-bold">{{ series.frequency ? `${series.frequency} min` : '' }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Accuracy
          </td>
          <td class="font-weight-bold">{{ series.accuracy | formatBooleanOption }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            SOP Bath
          </td>
          <td class="font-weight-bold">{{ series.sop_bath | formatBooleanOption }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Reviewed
          </td>
          <td class="font-weight-bold">{{ series.reviewed | formatBooleanOption }}</td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-divider class="mb-4"></v-divider>

    <div class="mx-4 pb-2">
      <div class="my-4">
        <v-btn color="primary" outlined block download disabled>
          <v-icon left>mdi-download</v-icon>Download CSV
        </v-btn>
        <v-btn
          color="error"
          outlined
          block
          class="mt-4"
          disabled
        >
          <v-icon left>mdi-delete</v-icon>
          Edit Series
        </v-btn>
        <v-btn
          color="error"
          outlined
          block
          class="mt-4"
          @click="confirmDelete"
          :loading="deleteStatus.loading"
        >
          <v-icon left>mdi-delete</v-icon>
          Delete Series
        </v-btn>
      </div>
      <Alert type="error" title="Error Occurred" v-if="deleteStatus.error">{{ deleteStatus.error }}</Alert>
    </div>

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
export default {
  name: 'SeriesInfo',
  props: ['series'],
  data () {
    return {
      deleteStatus: {
        loading: false,
        error: null
      }
    }
  },
  methods: {
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
    }
  }
}
</script>
