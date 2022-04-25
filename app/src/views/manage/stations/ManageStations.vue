<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="stations"
      :loading="loading"
      @click:row="clickRow"
      loading-text="Loading... Please wait"
      class="row-cursor-pointer">
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h5">Stations</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create" class="mr-2">
            <v-icon left>mdi-plus</v-icon> New Station
          </v-btn>
          <v-btn color="success" :to="{name: 'manageStationsImport'}" class="ml-2">
            <v-icon left>mdi-table-plus</v-icon> Batch Import
          </v-btn>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to edit or upload data for a station
        </div>
        <v-divider></v-divider>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.code="{ item }">
        {{ item.code | truncate(20) }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.private="{ item }">
        <v-icon v-if="item.private">mdi-check-circle</v-icon>
        <v-icon v-else>mdi-circle-outline</v-icon>
      </template>
    </v-data-table>
    <ManageStationForm ref="form"></ManageStationForm>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import ManageStationForm from '@/views/manage/stations/ManageStationForm'

export default {
  name: 'ManageStations',
  components: { ManageStationForm },
  data () {
    return {
      loading: true,
      stations: [],
      error: null,
      search: '',
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left'
        },
        {
          text: 'Organization',
          value: 'organization_id',
          align: 'left'
        },
        {
          text: 'Code',
          value: 'code',
          align: 'left'
        },
        {
          text: 'Placement',
          value: 'placement',
          align: 'left'
        },
        {
          text: 'Waterbody Name',
          value: 'waterbody_name',
          align: 'left'
        },
        {
          text: 'Waterbody Type',
          value: 'waterbody_type',
          align: 'left'
        },
        {
          text: 'Active',
          value: 'active',
          align: 'left'
        },
        {
          text: 'Mixed',
          value: 'mixed',
          align: 'left'
        },
        {
          text: 'Private',
          value: 'private',
          align: 'left'
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.restricted.get('/stations')
        this.stations = response.data
      } catch (err) {
        this.error = err.toString()
      } finally {
        this.loading = false
      }
    },
    async create () {
      const station = await this.$refs.form.open()
      if (station) {
        await this.fetch()
      }
    },
    clickRow (station) {
      this.$router.push({ name: 'manageStation', params: { stationId: station.id } })
    }
  }
}
</script>
