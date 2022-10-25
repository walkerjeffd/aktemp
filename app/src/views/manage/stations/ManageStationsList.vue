<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Failed to Load Stations" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
    <v-row v-else>
      <v-col cols="12" xl="6">
        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="stations"
          :search="search"
          :loading="status.loading || deleting"
          :sort-by.sync="sort.by"
          :sort-desc.sync="sort.desc"
          @click:row="select"
          loading-text="Loading... Please wait"
          class="row-cursor-pointer elevation-2"
          show-select
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title class="text-h6">Stations</v-toolbar-title>
              <v-divider inset vertical class="mx-4"></v-divider>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search stations"
                single-line
                hide-details
                clearable
                dense
              ></v-text-field>
              <v-spacer></v-spacer>
              <v-btn color="success" @click="create" class="mr-2">
                <v-icon left>mdi-plus</v-icon> Add
              </v-btn>
              <v-btn color="success" :to="{name: 'manageStationsBatch'}" class="ml-2">
                <v-icon left>mdi-table-plus</v-icon> Batch Import
              </v-btn>
              <v-divider inset vertical class="ml-4"></v-divider>
              <RefreshButton @click="fetch"></RefreshButton>
            </v-toolbar>
            <div class="body-2 text--secondary mx-4 mb-2">
              <v-icon small>mdi-information-outline</v-icon>
              Click on a row to view and manage a station
            </div>
            <v-divider></v-divider>
          </template>
          <template v-slot:item.code="{ item }">
            {{ item.code | truncate(20) }}
          </template>
          <template v-slot:item.waterbody_name="{ item }">
            {{ item.waterbody_name | truncate(40) }}
          </template>
          <template v-slot:item.private="{ item }">
            <Checkbox :value="item.private"></Checkbox>
          </template>
          <template v-slot:footer.prepend>
            <v-btn
              outlined
              color="error"
              :disabled="selected.length === 0"
              :loading="deleting"
              @click="confirmDelete"
            >
              <v-icon left>mdi-delete</v-icon>
              Delete Selected <span v-if="selected.length > 0">&nbsp;({{selected.length}})</span>
            </v-btn>
          </template>
        </v-data-table>
        <ManageStationForm ref="form"></ManageStationForm>
      </v-col>
      <v-col cols="12" xl="6" style="min-height:500px">
        <StationsMap
          :stations="stations"
          @select="select"
          class="elevation-2"
        ></StationsMap>
      </v-col>
    </v-row>
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
          These stations and all of their data will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import StationsMap from '@/components/StationsMap'
import ManageStationForm from '@/views/manage/stations/ManageStationForm'
import evt from '@/events'

export default {
  name: 'ManageStationsHome',
  components: { ManageStationForm, StationsMap },
  data () {
    return {
      deleting: false,
      search: '',
      selected: [],
      sort: {
        by: ['code'],
        desc: [false]
      },
      headers: [
        {
          text: 'ID',
          value: 'id',
          width: '80px'
        },
        {
          text: 'Code',
          value: 'code'
        },
        {
          text: 'Waterbody Type',
          value: 'waterbody_type'
        },
        {
          text: 'Waterbody Name',
          value: 'waterbody_name'
        },
        {
          text: 'Private',
          value: 'private',
          align: 'center'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization',
      stations: 'manage/stations',
      status: 'manage/stationsStatus'
    })
  },
  watch: {
    organization () {
      this.fetch()
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.$store.dispatch('manage/fetchStations')
    },
    select (station) {
      this.$router.push({ name: 'manageStation', params: { stationId: station.id } })
    },
    async create () {
      const station = await this.$refs.form.open()
      if (station) {
        await this.fetch()
      }
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteStations()
      }
    },
    async deleteStations () {
      const stations = this.selected.slice()
      this.deleting = true
      for (let i = 0; i < stations.length; i++) {
        const station = stations[i]
        try {
          await this.$http.restricted.delete(`/stations/${station.id}`)
          this.$store.dispatch('manage/removeStationById', station.id)
          this.unselectById(station.id)
        } catch (err) {
          console.error(err)
          this.error = this.$errorMessage(err)
          evt.$emit('notify', `Failed to delete station (${station.code})`, 'error')
          this.deleting = false
          return
        }
      }
      this.fetch()
      evt.$emit('notify', 'Selected stations have been deleted', 'success')
      this.deleting = false
    },
    unselectById (id) {
      this.selected = this.selected.filter(d => d.id !== id)
    }
  }
}
</script>
