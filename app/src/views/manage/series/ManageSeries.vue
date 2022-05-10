<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Failed to Load Series" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
    <v-data-table
      :headers="headers"
      :items="series"
      :loading="status.loading"
      :options="{ itemsPerPage: 10 }"
      @click:row="select"
      single-select
      loading-text="Loading... Please wait"
      class="row-cursor-pointer elevation-2"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h5">Timeseries</v-toolbar-title>
          <RefreshButton @click="fetch"></RefreshButton>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to view the timeseries
        </div>
        <v-divider></v-divider>
      </template>
      <template v-slot:item.station_code="{ item }">
        {{ item.station_code | truncate(20) }}
      </template>
      <template v-slot:item.start_datetime="{ item }">
        {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'lll z') }}
      </template>
      <template v-slot:item.end_datetime="{ item }">
        {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'lll z') }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageSeries',
  data () {
    return {
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left',
          width: '80px'
        },
        {
          text: 'Station',
          value: 'station_code',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Start',
          value: 'start_datetime',
          align: 'left'
        },
        {
          text: 'End',
          value: 'end_datetime',
          align: 'left'
        },
        {
          text: 'Depth (m)',
          value: 'depth_m',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Depth Cat.',
          value: 'depth_category',
          align: 'left',
          width: '200px'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization',
      series: 'manage/series',
      status: 'manage/seriesStatus'
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
      this.$store.dispatch('manage/fetchSeries')
    },
    select (series) {
      this.$router.push({ name: 'manageSeriesOne', params: { seriesId: series.id } })
    }
  }
}
</script>
