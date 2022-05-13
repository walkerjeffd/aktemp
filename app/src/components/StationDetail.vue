<template>
  <div style="position:absolute;top:20px;right:20px;z-index:3000;width:400px;background-color:white;margin:auto;pointer-events:auto" class="elevation-20">
    <v-toolbar color="grey darken-2" dark flat dense>
      <div class="font-weight-bold body-1">{{ station.code }}</div>
      <v-spacer></v-spacer>
      <v-btn icon small @click="zoomTo">
        <v-icon small>mdi-target</v-icon>
      </v-btn>
      <v-btn icon small @click="collapse = !collapse">
        <v-icon small v-if="collapse">mdi-menu-down</v-icon>
        <v-icon small v-else>mdi-menu-up</v-icon>
      </v-btn>
      <v-btn icon small @click="$emit('close')">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider v-if="!collapse"></v-divider>
    <div v-if="!collapse">
      <v-tabs
        v-model="tab"
        color="#00573d"
        dense
        fixed-tabs
      >
        <v-tab><v-icon left small>mdi-information-outline</v-icon> Info</v-tab>
        <v-tab><v-icon left small>mdi-chart-line</v-icon> Timeseries</v-tab>
        <v-tab><v-icon left small>mdi-arrow-expand-down</v-icon> Profiles</v-tab>

        <!-- INFO -->
        <v-tab-item>
          <v-simple-table dense class="pt-4">
            <tbody>
              <tr>
                <td class="text-right grey--text text--darken-2" style="width:140px">
                  Organization
                </td>
                <td class="font-weight-bold">{{ station.organization_code }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2" style="width:0px">
                  Code
                </td>
                <td class="font-weight-bold">{{ station.code }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Latitude
                </td>
                <td class="font-weight-bold">{{ station.latitude.toFixed(6) }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Longitude
                </td>
                <td class="font-weight-bold">{{ station.longitude.toFixed(6) }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Waterbody Name
                </td>
                <td class="font-weight-bold">{{ station.waterbody_name || 'N/A' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Waterbody Type
                </td>
                <td class="font-weight-bold">{{ station.waterbody_type || 'UNKNOWN' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Placement
                </td>
                <td class="font-weight-bold">{{ station.placement || 'UNKNOWN' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Fully Mixed
                </td>
                <td class="font-weight-bold">{{ station.mixed | formatBooleanOption }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Active
                </td>
                <td class="font-weight-bold">{{ station.active | formatBooleanOption }}</td>
              </tr>
            </tbody>
          </v-simple-table>
          <v-divider></v-divider>
          <div class="pa-4 d-flex">
            <v-spacer></v-spacer>
            <v-btn color="info" small disabled>
              <v-icon small left>mdi-download</v-icon>
              Download
            </v-btn>
          </div>
        </v-tab-item>

        <!-- TIMESERIES -->
        <v-tab-item class="pa-4">
          <Loading v-if="loading"></Loading>
          <v-alert type="warning" v-else-if="series.length === 0">
            No data at this station
          </v-alert>
          <div v-else>
            <v-simple-table dense>
              <tbody>
                <tr>
                  <td class="text-right grey--text text--darken-2" style="width:120px">
                    # Timeseries
                  </td>
                  <td class="font-weight-bold">{{ series.length }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-divider class="mb-4"></v-divider>
            <highcharts :options="chart"></highcharts>
            <v-divider class="my-4"></v-divider>
            <div class="d-flex">
              <v-btn color="info" small disabled>
                <v-icon small left>mdi-chart-line</v-icon>
                Explore
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn color="info" small disabled>
                <v-icon small left>mdi-download</v-icon>
                Download
              </v-btn>
            </div>
            <Alert type="info" title="Placeholder" class="mt-4 mb-0">Chart above simply plots the raw data for every time series for the station. Not scalable for high frequency or long-term stations. Plan to switch to daily mean/range of all timeseries. Then have "Explore" button open a larger winder for seeing the raw data.</Alert>
          </div>
        </v-tab-item>

        <!-- PROFILES -->
        <v-tab-item class="pa-4">
          <Alert type="warning" title="Working on it!">
            Not yet implemented...
          </Alert>
        </v-tab-item>
      </v-tabs>
    </div>
  </div>
</template>

<script>
import evt from '@/events'
export default {
  name: 'StationDetail',
  props: ['station'],
  data () {
    return {
      loading: true,
      collapse: false,
      tab: 0,
      series: [],
      chart: {
        chart: {
          zoomType: 'x',
          height: 200,
          marginLeft: 40,
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
          series: {
            boostThreshold: 1,
            turboThreshold: 0
          }
        },
        title: {
          text: undefined
        },
        legend: {
          enabled: false
        },
        tooltip: {
          // headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
          pointFormat: 'Temperature: <b>{point.y}</b> degC'
          // dateTimeLabelFormats: {
          //   year: '%b %e, %Y',
          //   month: '%b %e, %Y',
          //   day: '%b %e, %Y',
          //   hour: '%b %e, %Y',
          //   minute: '%b %e, %Y'
          // }
        },
        xAxis: {
          type: 'datetime'
          // dateTimeLabelFormats: {
          //   week: '%b %d'
          // },
          // title: {
          //   text: 'Date'
          // }
        },
        yAxis: {
          title: {
            text: undefined
          }
        },
        series: []
      }
    }
  },
  created () {
    this.fetchSeries()
  },
  watch: {
    station () {
      this.fetchSeries()
    }
  },
  methods: {
    async fetchSeries () {
      if (!this.station) return
      this.loading = true
      const response = await this.$http.public.get(`/stations/${this.station.id}/series`)
      const series = response.data
      for (let i = 0; i < series.length; i++) {
        const response = await this.$http.public.get(`/series/${series[i].id}/values`)
        series[i].values = response.data
      }
      this.series = Object.freeze(series)
      this.chart.series = series.map(s => {
        return {
          name: s.id,
          marker: {
            enabled: false
          },
          data: s.values.map(v => {
            return {
              x: (new Date(v.datetime)).valueOf(),
              y: v.value
            }
          })
        }
      })
      this.loading = false
    },
    zoomTo () {
      evt.$emit('map:zoomToStation', this.station)
    }
  }
}
</script>
