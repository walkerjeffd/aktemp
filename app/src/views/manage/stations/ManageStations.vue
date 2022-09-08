<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Failed to Load Stations" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
    <v-row v-else>
      <v-col cols="12" xl="6">
        <v-data-table
          :headers="headers"
          :items="stations"
          :loading="status.loading"
          :sort-by="['code']"
          @click:row="select"
          loading-text="Loading... Please wait"
          class="row-cursor-pointer elevation-2"
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title class="text-h5">Stations</v-toolbar-title>
              <RefreshButton @click="fetch"></RefreshButton>
              <v-spacer></v-spacer>
              <v-btn color="success" @click="create" class="mr-2">
                <v-icon left>mdi-plus</v-icon> New Station
              </v-btn>
              <v-btn color="success" :to="{name: 'manageStationsBatch'}" class="ml-2">
                <v-icon left>mdi-table-plus</v-icon> Batch Import
              </v-btn>
            </v-toolbar>
            <div class="body-2 text--secondary mx-4 mb-2">
              <v-icon small>mdi-information-outline</v-icon>
              Click on a row to edit or upload data for a station
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
            <v-icon v-if="item.private">mdi-check-circle</v-icon>
            <v-icon v-else>mdi-circle-outline</v-icon>
          </template>
        </v-data-table>
        <ManageStationForm ref="form"></ManageStationForm>
      </v-col>
      <v-col cols="12" xl="6" style="min-height:500px">
        <StationsMap
          :stations="stations"
          @select="select"
          class="elevation-4"
        ></StationsMap>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import StationsMap from '@/components/StationsMap'
import ManageStationForm from '@/views/manage/stations/ManageStationForm'

export default {
  name: 'ManageStations',
  components: { ManageStationForm, StationsMap },
  data () {
    return {
      search: '',
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left',
          width: '80px'
        },
        {
          text: 'Code',
          value: 'code',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Waterbody Name',
          value: 'waterbody_name',
          align: 'left'
        },
        {
          text: 'Private',
          value: 'private',
          align: 'center',
          width: '100px'
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
    }
  }
}
</script>
