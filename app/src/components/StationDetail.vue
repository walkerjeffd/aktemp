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
      >
        <v-tab>Info</v-tab>
        <v-tab>Data</v-tab>

        <!-- INFO -->
        <v-tab-item>
          <v-simple-table dense>
            <tbody>
              <tr>
                <td class="text-right grey--text text--darken-2" style="width:140px">
                  Organization
                </td>
                <td class="font-weight-bold">{{ station.organization_id }}</td>
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
                <td class="font-weight-bold">{{ station.waterbody_type || 'N/A' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Placement
                </td>
                <td class="font-weight-bold">{{ station.placement || 'Unknown' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Fully Mixed
                </td>
                <td class="font-weight-bold">{{ station.mixed || 'Unknown' }}</td>
              </tr>
              <tr>
                <td class="text-right grey--text text--darken-2">
                  Active
                </td>
                <td class="font-weight-bold">{{ station.active || 'Unknown' }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-tab-item>

        <!-- DATA -->
        <v-tab-item class="pa-4">
          <div v-if="loading">
            <div class="text-h6">Loading...</div>
          </div>
          <v-alert type="warning" v-else-if="series.length === 0">
            No data at this station
          </v-alert>
          <div v-else>
            <highcharts :options="chart"></highcharts>
            <v-divider class="my-4"></v-divider>
            <div class="text-right">
              <v-btn color="info" small disabled>
                <v-icon small left>mdi-download</v-icon>
                CSV File
              </v-btn>
            </div>
          </div>
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
      const series = await Promise.all(response.data.map(d => {
        return this.$http.public.get(`/series/${d.id}`)
          .then(response => response.data)
      }))
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
