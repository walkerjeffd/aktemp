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
                :text="`Download Daily Timeseries (${series.length === selected.length ? 'All' : selected.length})`"
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
import { rollup, mean, ascending } from 'd3'
import SeriesChart from '@/components/series/SeriesChart.vue'
import { assignRawFlags } from '@/lib/utils'

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
      console.log('downloadRaw', series)
      if (!series) return

      const values = await this.$http.public
        .get(`/series/${series.id}/values`)
        .then(d => d.data)
      const flags = await this.$http.public
        .get(`/series/${series.id}/flags`)
        .then(d => d.data)

      const results = assignRawFlags(values, flags)
      const flaggedValues = results.flags.map(flag => {
        return flag.values.map(value => {
          return {
            ...value,
            flag: flag.label
          }
        })
      }).flat()
      // combine overlapping flags
      const groupedFlaggedValues = Array.from(
        rollup(
          flaggedValues,
          v => v,
          d => d.datetime
        ),
        ([key, value]) => ({
          datetime: key,
          temp_c: mean(value.map(d => d.temp_c)),
          flag: value.map(d => d.flag).join(',')
        })
      )
      const outputValues = [results.values, groupedFlaggedValues].flat()
        .sort((a, b) => ascending(a.datetime, b.datetime))
      outputValues.forEach(d => {
        d.series_id = series.id
        d.flag = d.flag || ''
      })
      const filename = `AKTEMP-${this.station.organization_code}-${this.station.code}-series-${series.id}-raw.csv`
      this.$download.seriesRawValues(filename, this.station, series, outputValues)
    },
    async downloadDaily (series) {
      console.log('downloadDaily', series)

      // const values = series.map(s => {
      //   const flaggedValues = s.daily.flags.map(flag => {
      //     return flag.values.map(value => {
      //       return {
      //         ...value,
      //         flag: flag.label
      //       }
      //     })
      //   }).flat()

      //   const flagMap = rollup(
      //     flaggedValues,
      //     v => v.map(d => d.flag).join(','),
      //     d => d.date
      //   )

      //   return s.daily.values.map(v => ({
      //     ...v,
      //     series_id: s.id,
      //     flags: flagMap.get(v.date)
      //   }))
      // }).flat()
      //   .sort((a, b) => ascending(a.series_id, b.series_id) || ascending(a.date, b.date))
      const dailyValues = series
        .filter(d => d.interval === 'CONTINUOUS')
        .map(s => {
          return s.daily.values.map(v => ({
            ...v,
            series_id: s.id
          }))
        })
        .flat()
        .sort((a, b) => ascending(a.series_id, b.series_id) || ascending(a.date, b.date))
      const discreteValues = series
        .filter(d => d.interval === 'DISCRETE')
        .map(s => {
          return s.daily.values.map(v => ({
            series_id: s.id,
            datetime: v.datetime,
            temp_c: v.temp_c,
            flag: v.flag
          }))
        })
        .flat()
        .sort((a, b) => ascending(a.series_id, b.series_id) || ascending(a.datetime, b.datetime))

      const filename = `AKTEMP-${this.station.organization_code}-${this.station.code}-series-daily.csv`
      this.$download.seriesDailyValues(filename, this.station, series, dailyValues, discreteValues)
    }
  }
}
</script>
