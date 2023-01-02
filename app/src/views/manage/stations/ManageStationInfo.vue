<template>
  <v-card>
    <StationInfoTable :station="station"></StationInfoTable>
    <v-divider></v-divider>
    <div class="mx-2 pb-1">
      <v-btn outlined block class="my-2" color="primary" @click="downloadStation">
        <v-icon left>mdi-download</v-icon> Download Metadata
      </v-btn>
      <v-btn outlined block class="my-2" color="primary" :to="{ name: 'explorerStation', params: { stationId: station.id } }">
        <v-icon left>mdi-earth</v-icon> Show in Explorer
      </v-btn>
      <v-btn outlined block class="my-2" color="success" @click="edit">
        <v-icon left>mdi-pencil</v-icon> Edit Station
      </v-btn>
      <v-btn outlined block class="my-2" color="error" @click="confirmDelete" :loading="deleteStatus.loading">
        <v-icon left>mdi-delete</v-icon> Delete Station
      </v-btn>
    </div>

    <Alert v-if="!deleteStatus.loading && deleteStatus.error" type="error" title="Failed to Delete Station">
      {{ deleteStatus.error }}
    </Alert>

    <ManageStationForm ref="form"></ManageStationForm>

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
          All of the datasets and images associated with this station set will be deleted from the server. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-card>
</template>

<script>
import { writeStationsFile } from 'aktemp-utils/downloads'
import { countDays } from 'aktemp-utils/time'

import evt from '@/events'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManageStationForm from '@/views/manage/stations/ManageStationForm'
import StationInfoTable from '@/components/StationInfoTable'

export default {
  name: 'ManageMetadata',
  components: { ConfirmDialog, ManageStationForm, StationInfoTable },
  props: ['station'],
  data () {
    return {
      loading: true,
      error: null,
      deleteStatus: {
        loading: false,
        error: null
      }
    }
  },
  methods: {
    async edit () {
      const station = await this.$refs.form.open(this.station)
      if (station) {
        this.$emit('refresh')
      }
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteStation()
      }
    },
    async deleteStation () {
      this.deleteStatus.loading = true
      this.deleteStatus.error = null
      try {
        await this.$http.restricted.delete(`/providers/${this.station.provider_id}/stations/${this.station.id}`)
        evt.$emit('notify', `Station (${this.station.code}) has been deleted`, 'success')
        this.$router.push({ name: 'manageStations' })
      } catch (err) {
        console.log(err)
        this.deleteStatus.error = err.message || err.toString()
      } finally {
        this.deleteStatus.loading = false
      }
    },
    downloadStation () {
      const station = {
        ...this.station,
        series_count_days: countDays(this.station.series_start_datetime, this.station.series_end_datetime, this.station.timezone)
      }
      const body = writeStationsFile([station])
      const filename = `AKTEMP-${this.station.provider_code}-${this.station.code}-station.csv`
      this.$download(body, filename)
    }
  }
}
</script>

<style>

</style>
