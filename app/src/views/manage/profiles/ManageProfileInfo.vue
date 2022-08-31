<template>
  <v-sheet elevation="2">
    <v-simple-table dense v-if="profile">
      <tbody>
        <tr>
          <td class="text-right grey--text text--darken-2" style="width:100px">
            Profile ID
          </td>
          <td class="font-weight-bold">{{ profile.id }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Organization
          </td>
          <td class="font-weight-bold">{{ profile.organization_code }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Station
          </td>
          <td class="font-weight-bold"><router-link :to="{ name: 'manageStation', params: { stationId: profile.station_id }}">{{ profile.station_code }}</router-link></td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            File
          </td>
          <td class="font-weight-bold"><router-link :to="{ name: 'manageFile', params: { fileId: profile.file_id }}">{{ profile.file_filename }}</router-link></td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Date
          </td>
          <td class="font-weight-bold">{{ profile.date | timestampTimezoneFormat(profile.station_timezone, 'll') }}</td>
        </tr>
        <!-- <tr>
          <td class="text-right grey--text text--darken-2">
            Depth Range
          </td>
          <td class="font-weight-bold">TODO</td>
        </tr> -->
        <tr>
          <td class="text-right grey--text text--darken-2">
            Accuracy
          </td>
          <td class="font-weight-bold">{{ profile.accuracy | formatBooleanOption }}</td>
        </tr>
        <!-- <tr>
          <td class="text-right grey--text text--darken-2">
            SOP Bath
          </td>
          <td class="font-weight-bold">{{ profile.sop_bath | formatBooleanOption }}</td>
        </tr> -->
        <tr>
          <td class="text-right grey--text text--darken-2">
            Reviewed
          </td>
          <td class="font-weight-bold">{{ profile.reviewed | formatBooleanOption }}</td>
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
          Edit Profile
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
          Delete Profile
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
          This profile and all its data will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-sheet>
</template>

<script>
export default {
  name: 'ManageProfileInfo',
  props: ['profile'],
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
        return await this.deleteSeries()
      }
    },
    async deleteSeries () {
      this.deleteStatus.loading = true
      this.deleteStatus.error = null
      try {
        await this.$http.restricted.delete(`/profile/${this.profile.id}`)
        this.$router.push({ name: 'manageProfiles' })
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

<style>

</style>
