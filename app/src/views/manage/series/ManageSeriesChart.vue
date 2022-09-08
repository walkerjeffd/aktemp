<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-sheet class="elevation-2 py-4 px-4">
    <Loading v-if="loading" class="mb-4"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data">{{ error }}</Alert>
    <Alert v-else-if="values && values.length === 0" type="error" title="No Data">This timeseries does not have any data</Alert>
    <div v-else>
      <highcharts :options="chart"></highcharts>
      <v-row class="mt-8 d-flex">
        <v-col cols="12">
          <v-btn
            class="mr-2"
            :depressed="mode === 'flag'"
            :color="mode === 'flag' ? 'warning' : 'default'"
            @click="toggleFlag"
          >Mark Flags</v-btn>
          <v-btn
            class="ml-2"
            @click="clearFlags"
          >Clear All Flags</v-btn>
          <v-btn
            class="ml-2"
            @click="ref.show = !ref.show"
            :depressed="ref.show"
            :color="ref.show ? 'warning' : 'default'"
          >Add Reference</v-btn>
        </v-col>
        <v-col cols="12" lg="6">
          <v-select
            :items="flagType.options"
            v-model="flagType.selected"
            label="Select flag type"
            item-text="description"
            item-value="id"
            hide-details
            return-object
            :disabled="mode !== 'flag'"
          ></v-select>
        </v-col>
        <v-col cols="12" lg="6">
          <v-text-field
            v-model="flagType.other"
            label="Define other flag"
            hide-details
            :disabled="mode !== 'flag' || (flagType.selected && flagType.selected.id !== 'OTHER')"
          ></v-text-field>
        </v-col>
        <v-col cols="12" v-if="ref.show">
          <v-data-table
            v-model="ref.selected"
            :headers="ref.headers"
            :items="refSeries"
            :options="{ itemsPerPage: 10 }"
            dense
            show-select
            single-select
            class="row-cursor-pointer elevation-2"
          >
            <template v-slot:top>
              <v-toolbar flat>
                <v-toolbar-title>Reference Timeseries</v-toolbar-title>
              </v-toolbar>
              <v-divider></v-divider>
            </template>
            <template v-slot:item.station_code="{ item }">
              {{ item.station_code | truncate(20) }}
            </template>
            <template v-slot:item.start_datetime="{ item }">
              {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
            </template>
            <template v-slot:item.end_datetime="{ item }">
              {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
            </template>
            <template v-slot:item.depth="{ item }">
              {{ item | seriesDepth }}
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </div>
  </v-sheet>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageSeriesChart',
  props: ['series'],
  data () {
    return {
      loading: true,
      error: null,
      values: [],
      flags: [],
      mode: 'zoom',
      flagType: {
        selected: null,
        other: '',
        options: [
          {
            id: 'OOW',
            description: 'Out of water',
            color: 'red'
          },
          {
            id: 'BURIAL',
            description: 'Buried sensor',
            color: 'orange'
          },
          {
            id: 'OTHER',
            description: 'Other flag',
            color: 'purple'
          }
        ]
      },
      chart: {
        boost: {
          useGPUTranslations: true,
          seriesThreshold: 1
        },
        chart: {
          type: 'line',
          height: 300,
          marginLeft: 70,
          marginRight: 20,
          zoomType: 'x',
          panning: true,
          panKey: 'shift',
          events: {
            selection: this.onSelect
          }
        },
        plotOptions: {
          line: {
            marker: {
              enabled: false
            }
          },
          series: {
            boostThreshold: 1,
            turboThreshold: 0
          }
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: true
        },
        tooltip: {
          pointFormat: 'Temperature: <b>{point.y}</b> degC'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: 'Temperature (degC)',
            margin: 14,
            style: {
              fontSize: '16px'
            }
          }
        },
        series: []
      },
      ref: {
        show: false,
        selected: [],
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
            text: 'Depth',
            value: 'depth',
            align: 'left',
            width: '200px'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters({
      allSeries: 'manage/series'
    }),
    refSeries () {
      const start = new Date(this.series.start_datetime)
      const end = new Date(this.series.end_datetime)
      return this.allSeries
        .filter(d => d.id !== this.series.id)
        .filter(d => (start <= new Date(d.end_datetime)) && (new Date(d.start_datetime) <= end))
    },
    flagColors () {
      const flagColors = {}
      this.flagType.options.forEach(d => {
        flagColors[d.id] = d.color
      })
      return flagColors
    }
  },
  watch: {
    mode () {
      this.changeMode()
    },
    async 'ref.selected' () {
      if (this.ref.selected.length > 0) {
        const response = await this.$http.restricted.get(`/series/${this.ref.selected[0].id}/values`)
        const values = response.data
        this.chart.series = [
          this.chart.series[0],
          {
            name: `Reference (ID=${this.ref.selected[0].id})`,
            data: values.map(d => {
              return [(new Date(d.datetime)).valueOf(), d.value]
            }),
            enableMouseTracking: false,
            color: '#DDDDDD',
            zIndex: 0
          }
        ]
      } else {
        this.chart.series = [this.chart.series[0]]
      }
    }
  },
  mounted () {
    this.fetch()
    this.flagType.selected = this.flagType.options[0]
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const response = await this.$http.restricted.get(`/series/${this.$route.params.seriesId}/values`)
        const values = response.data
        values.forEach(d => {
          d.datetime = new Date(d.datetime)
        })
        this.values = Object.freeze(values)
        this.chart.series = [{
          name: `Series ID=${this.$route.params.seriesId}`,
          data: this.values.map(v => {
            return [v.datetime.valueOf(), v.value]
          }),
          zones: [],
          zoneAxis: 'x',
          zIndex: 1
        }]
      } catch (err) {
        this.err = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    toggleFlag () {
      if (this.mode === 'flag') {
        this.mode = 'zoom'
      } else {
        this.mode = 'flag'
      }
    },
    toggleUnflag () {
      if (this.mode === 'unflag') {
        this.mode = 'zoom'
      } else {
        this.mode = 'unflag'
      }
    },
    changeMode () {
      if (this.mode === 'zoom') {
        this.chart.chart.zoomType = 'x'
      } else {
        this.chart.chart.zoomType = 'x'
      }
    },
    onSelect (event) {
      if (this.mode === 'zoom') return
      event.preventDefault()
      if (this.mode === 'flag') {
        this.setFlags(new Date(event.xAxis[0].min), new Date(event.xAxis[0].max))
      }
    },
    clearFlags () {
      const values = this.values.slice()
      values.forEach(d => {
        d.flag_id = null
      })
      this.values = Object.freeze(values)
      this.updateZones()
    },
    setFlags (start, end) {
      if (!this.flagType.selected) return alert('flag type not selected')

      const values = this.values.slice()
      values.forEach(d => {
        if (d.datetime >= start && d.datetime <= end) {
          d.flag_id = this.flagType.selected.id
          if (this.flagType.selected.id === 'OTHER') {
            this.flag_other = this.flagType.other
          }
        }
      })
      this.values = Object.freeze(values)
      this.updateZones()
    },
    updateZones () {
      const zones = []
      this.values.forEach((v, i) => {
        if (i === (this.values.length - 1)) return
        if (v.flag_id !== this.values[i + 1].flag_id) {
          zones.push({
            value: v.datetime.valueOf(),
            color: v.flag_id ? this.flagColors[v.flag_id] : null,
            flag_id: v.flag_id
          })
        }
      })
      this.chart.series[0].zones = zones
    }
  }
}
</script>

<style>

</style>
