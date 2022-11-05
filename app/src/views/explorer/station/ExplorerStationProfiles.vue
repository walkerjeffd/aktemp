<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="pa-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="info" v-else-if="profiles.length === 0" title="No Profiles Available" class="mb-0">
      This station does not have any vertical profile data.
    </Alert>
    <div v-else>
      <v-row>
        <v-col cols="12" xl="6">
          <v-sheet elevation="2" class="pa-4">
            <ProfilesChart :profiles="selected"></ProfilesChart>
          </v-sheet>
        </v-col>
        <v-col cols="12" xl="6">
          <v-sheet elevation="2">
            <v-data-table
              v-model="selected"
              :headers="table.headers"
              :items="profiles"
              :loading="loading"
              :options="{ itemsPerPage: 5 }"
              show-select
              dense
              loading-text="Loading... Please wait"
              @input="onInput"
              @toggle-select-all="selectAll"
            >
              <template v-slot:item.station_code="{ item }">
                {{ item.station_code | truncate(20) }}
              </template>
              <template v-slot:item.date="{ item }">
                {{ item.date | timestamp('DD') }}
              </template>
            </v-data-table>
            <v-divider></v-divider>
            <div class="text-right pa-4">
              <DownloadButton text="Download Profiles" @click="download"></DownloadButton>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import ProfilesChart from '@/components/profiles/ProfilesChart.vue'

export default {
  name: 'ExploreStationProfiles',
  components: { ProfilesChart },
  props: ['station'],
  data () {
    return {
      loading: true,
      profiles: [],
      selected: [],
      chart: {
        chart: {
          height: 400,
          marginLeft: 50,
          type: 'scatter'
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          pointFormat: 'Temperature: <b>{point.x} °C</b>',
          valueDecimals: 1
        },
        xAxis: {
          title: {
            text: 'Temperature (degC)',
            align: 'high',
            margin: 14
          },
          opposite: true,
          startOnTick: true
        },
        yAxis: {
          title: {
            text: 'Depth (m)'
          },
          reversed: true,
          lineWidth: 1,
          tickWidth: 1,
          startOnTick: true,
          endOnTick: false
        },
        series: []
      },
      table: {
        headers: [
          {
            text: 'ID',
            value: 'id',
            width: '80px'
          },
          {
            text: 'Date',
            value: 'date'
          },
          {
            text: '# Values',
            value: 'values_count'
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
      const response = await this.$http.public.get(`/stations/${this.station.id}/profiles/values`)
      const profiles = response.data

      this.profiles = profiles
      this.selected = this.profiles

      this.chart.series = profiles.map(p => ({
        name: p.id,
        zIndex: 1,
        lineWidth: 1,
        marker: {
          symbol: 'circle',
          radius: 3
        },
        data: p.values.map(v => {
          return [
            v.temp_c,
            v.depth_m
          ]
        })
      }))

      this.loading = false
    },
    updateChart () {
      const selectedSeriesIds = this.selected.map(d => d.id)
      if (this.$refs.profileChart) {
        this.$refs.profileChart.chart.series.forEach((s) => {
          if (selectedSeriesIds.includes(s.name)) {
            s.setVisible(true, false)
          } else {
            s.setVisible(false, false)
          }
        })
        this.$refs.profileChart.chart.redraw(false)
      }
    },
    onInput () {
      this.updateChart()
    },
    selectAll () {
      if (this.selected.length < this.profiles.length) {
        this.selected = this.profiles
      } else {
        this.selected = []
      }
    },
    download () {
      const filename = `AKTEMP-${this.station.organization_code}-${this.station.code}-profiles.csv`
      this.$download.profilesValues(filename, this.station, this.profiles)
    }
  }
}
</script>
