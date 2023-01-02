<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="pa-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="info" v-else-if="series.length === 0" title="No Timeseries Data Available" class="mb-0">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <v-row>
        <v-col cols="12">
          <v-sheet elevation="2" class="pa-4">
            <SeriesChart :series="selected"></SeriesChart>
          </v-sheet>
        </v-col>
        <v-col cols="12">
          <v-sheet elevation="2">
            <v-data-table
              v-model="selected"
              :headers="table.headers"
              :items="series"
              :loading="loading"
              :options="{ itemsPerPage: 5 }"
              show-select
              dense
              loading-text="Loading... Please wait"
              @toggle-select-all="selectAll"
            >
              <template v-slot:item.station_code="{ item }">
                {{ item.station_code | truncate(20) }}
              </template>
              <template v-slot:item.start_datetime="{ item }">
                {{ item.start_datetime | timestamp('DD', item.station_timezone) }}
              </template>
              <template v-slot:item.end_datetime="{ item }">
                {{ item.end_datetime | timestamp('DD', item.station_timezone) }}
              </template>
              <template v-slot:item.download="{ item }">
                <v-btn
                  title="Download Raw Timeseries Data as CSV"
                  @click="downloadRaw(item)"
                  outlined
                  x-small
                >
                  <v-icon x-small class="mr-2">mdi-download</v-icon>Raw
                </v-btn>
              </template>
            </v-data-table>
            <v-divider></v-divider>
            <div class="text-right pa-4">
              <DownloadButton
                :text="`Download Daily and Discrete Timeseries (${series.length === selected.length ? 'All' : selected.length})`"
                :disabled="selected.length === 0"
                @click="downloadDaily(selected)"
              ></DownloadButton>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import SeriesChart from '@/components/series/SeriesChart.vue'
import { assignFlags } from 'aktemp-utils/flags'
import { writeSeriesDailyDiscreteFile, writeSeriesRawFile } from 'aktemp-utils/downloads'

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
            width: '70px'
          },
          {
            text: 'Start',
            value: 'start_datetime'
          },
          {
            text: 'End',
            value: 'end_datetime'
          },
          {
            text: 'Depth (m)',
            value: 'depth_m'
          },
          {
            text: 'Interval',
            value: 'interval'
          },
          {
            text: 'Download',
            value: 'download'
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
      this.series.forEach(d => {
        d.flags.forEach(f => {
          f.start_datetime = new Date(f.start_datetime)
          f.end_datetime = new Date(f.end_datetime)
        })
      })
      this.selected = this.series

      this.loading = false
    },
    selectAll () {
      if (this.selected.length < this.series.length) {
        this.selected = this.series
      } else {
        this.selected = []
      }
    },
    async downloadRaw (series) {
      // console.log('downloadRaw', series)
      if (!series) return

      let values = await this.$http.public
        .get(`/series/${series.id}/values`)
        .then(d => d.data)
      const flags = await this.$http.public
        .get(`/series/${series.id}/flags`)
        .then(d => d.data)

      values = assignFlags(values, flags)
      const seriesValues = {
        ...series,
        values
      }
      const body = writeSeriesRawFile([seriesValues])
      const filename = `AKTEMP-${this.station.provider_code}-${this.station.code}-series-${series.id}-raw.csv`
      this.$download(body, filename)
    },
    async downloadDaily (series) {
      console.log('downloadDaily', series)
      if (!series) return

      const body = writeSeriesDailyDiscreteFile(series)
      const filename = `AKTEMP-${this.station.provider_code}-${this.station.code}-series-daily.csv`
      this.$download(body, filename)
    }
  }
}
</script>
