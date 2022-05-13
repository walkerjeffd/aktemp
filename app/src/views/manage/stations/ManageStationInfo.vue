<template>
  <v-card>
    <!-- <v-toolbar flat>
      <v-toolbar-title class="text-h6">Info</v-toolbar-title>
    </v-toolbar>
    <v-divider></v-divider> -->
    <v-simple-table dense>
      <tbody>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            ID
          </td>
          <td class="font-weight-bold">{{ station.id }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Organization
          </td>
          <td class="font-weight-bold">{{ station.organization_code }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Station Code
          </td>
          <td class="font-weight-bold">{{ station.code }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Description
          </td>
          <td class="font-weight-bold">{{ station.description | truncate(40) }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Latitude
          </td>
          <td class="font-weight-bold">{{ station.latitude.toFixed(4) }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Longitude
          </td>
          <td class="font-weight-bold">{{ station.longitude.toFixed(4) }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Placement
          </td>
          <td class="font-weight-bold">{{ station.placement }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Timezone
          </td>
          <td class="font-weight-bold">{{ station.timezone }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Waterbody Name
          </td>
          <td class="font-weight-bold">{{ station.waterbody_name }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Waterbody Type
          </td>
          <td class="font-weight-bold">{{ station.waterbody_type }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Active
          </td>
          <td class="font-weight-bold">{{ station.active | formatBooleanOption }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Mixed
          </td>
          <td class="font-weight-bold">{{ station.mixed | formatBooleanOption }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Reference
          </td>
          <td class="font-weight-bold">{{ (station.reference || 'N/A') | truncate(40) }}</td>
        </tr>
        <tr>
          <td
            class="text-right grey--text text--darken-2"
            style="width:140px">
            Private
          </td>
          <td class="font-weight-bold">{{ station.private | formatBooleanOption }}</td>
        </tr>
      </tbody>
    </v-simple-table>
    <v-divider></v-divider>
    <div class="mx-4 mt-4 pb-4">
      <div class="mb-4">
        <v-btn block outlined color="primary" @click="edit">
          <v-icon left>mdi-pencil</v-icon> Edit Station
        </v-btn>
      </div>
      <div>
        <v-btn block outlined color="error" @click="confirmDelete" :loading="deleteStatus.loading">
          <v-icon left>mdi-delete</v-icon> Delete Station
        </v-btn>
      </div>
    </div>
    <v-card-text v-if="!deleteStatus.loading && deleteStatus.error">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Failed to Delete Station</div>
        <div>{{ deleteStatus.error }}</div>
      </v-alert>
    </v-card-text>

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
import evt from '@/events'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManageStationForm from '@/views/manage/stations/ManageStationForm'

export default {
  name: 'ManageMetadata',
  components: { ConfirmDialog, ManageStationForm },
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
        await this.$http.restricted.delete(`/organizations/${this.station.organization_id}/stations/${this.station.id}`)
        evt.$emit('notify', `Station (${this.station.code}) has been deleted`, 'success')
        this.$router.push({ name: 'manageStations' })
      } catch (err) {
        console.log(err)
        this.deleteStatus.error = err.message || err.toString()
      } finally {
        this.deleteStatus.loading = false
      }
    }
  }
}
</script>

<style>

</style>
