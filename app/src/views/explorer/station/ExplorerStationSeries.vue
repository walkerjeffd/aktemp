<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="pa-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="info" v-else-if="series.length === 0" title="No Timeseries Data Available" class="mb-0">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <SeriesChart :series="series" :selected="selected"></SeriesChart>
      <v-divider class="my-4"></v-divider>
      <v-data-table
        v-model="selected"
        :headers="table.headers"
        :items="series"
        :loading="loading"
        :options="{ itemsPerPage: 5 }"
        show-select
        loading-text="Loading... Please wait"
        @toggle-select-all="selectAll"
      >
        <template v-slot:item.station_code="{ item }">
          {{ item.station_code | truncate(20) }}
        </template>
        <template v-slot:item.start_datetime="{ item }">
          {{ item.start_datetime | formatTimestamp('ll', item.station_timezone) }}
        </template>
        <template v-slot:item.end_datetime="{ item }">
          {{ item.end_datetime | formatTimestamp('ll', item.station_timezone) }}
        </template>
      </v-data-table>
      <v-divider class="mb-4"></v-divider>
      <div class="text-right">
        <DownloadButton disabled small></DownloadButton>
      </div>
      <!-- <pre>selected: {{ selected }}</pre> -->
    </div>
  </div>
</template>

<script>
// import * as d3 from 'd3'

// import { assignDailyFlags } from '@/lib/utils'

import SeriesChart from '@/components/series/SeriesChart.vue'

export default {
  name: 'ExploreStationSeries',
  components: { SeriesChart },
  props: ['station'],
  data () {
    return {
      loading: true,
      series: [],
      selected: [],
      table: {
        headers: [
          {
            text: 'ID',
            value: 'id',
            align: 'left',
            width: '70px'
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
            text: 'Depth Category',
            value: 'depth_category',
            align: 'left'
          },
          {
            text: 'Depth (m)',
            value: 'depth_m',
            align: 'left'
          }
        ]
      }
    }
  },
  mounted () {
    this.fetch()
  },
  watch: {
    station () {
      this.fetch()
    }
  },
  methods: {
    async fetch () {
      if (!this.station) return

      this.loading = true
      this.series = await this.$http.public
        .get(`/stations/${this.station.id}/series`)
        .then(d => d.data)
      this.selected = this.series

      this.loading = false
    },
    selectAll () {
      if (this.selected.length < this.series.length) {
        this.selected = this.series
      } else {
        this.selected = []
      }
    }
  }
}
</script>
