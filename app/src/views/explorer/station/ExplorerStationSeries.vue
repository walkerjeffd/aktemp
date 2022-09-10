<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="pa-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="error" v-else-if="series.length === 0" title="No Timeseries Data Available" class="mb-0">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <highcharts :constructor-type="'stockChart'" :options="chart" ref="seriesChart"></highcharts>
      <v-divider class="my-4"></v-divider>
      <v-data-table
        v-model="selected"
        :headers="table.headers"
        :items="series"
        :loading="loading"
        :options="{ itemsPerPage: 5 }"
        show-select
        loading-text="Loading... Please wait"
        @input="onInput"
        @toggle-select-all="selectAll"
      >
        <template v-slot:item.station_code="{ item }">
          {{ item.station_code | truncate(20) }}
        </template>
        <template v-slot:item.period="{ item }">
          {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }} - {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
        <!-- <template v-slot:item.start_datetime="{ item }">
          {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
        <template v-slot:item.end_datetime="{ item }">
          {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template> -->
      </v-data-table>
      <v-divider class="mb-4"></v-divider>
      <div class="d-flex">
        <!-- <v-spacer></v-spacer> -->
        <v-btn color="info" disabled>
          <v-icon left>mdi-download</v-icon>
          Download Timeseries
        </v-btn>
      </div>
      <!-- <pre>selected: {{ selected }}</pre> -->
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'ExploreStationSeries',
  props: ['station'],
  data () {
    return {
      loading: true,
      series: [],
      selected: [],
      chart: {
        plotOptions: {
          arearange: {
            linkedTo: ':previous',
            lineWidth: 0,
            color: 'black',
            fillOpacity: 0.2,
            zIndex: 0,
            label: {
              enabled: false
            },
            marker: {
              enabled: false
            },
            enableMouseTracking: false,
            states: {
              hover: {
                enabled: false
              },
              select: {
                enabled: false
              }
            }
          },
          line: {
            lineWidth: 1,
            zIndex: 1,
            marker: {
              enabled: false
            }
          },
          series: {
            animation: false,
            gapSize: 5,
            states: {
              hover: {
                enabled: false
              },
              select: {
                enabled: false
              }
            }
            // boostThreshold: 5000000,
            // dataGrouping: {
            //   enabled: false
            // }
          }
        },
        lang: {
          noData: 'No data to display'
        },
        noData: {
          style: {
            fontWeight: 'bold',
            fontSize: '15px',
            color: '#303030'
          }
        },
        boost: {
          useGPUTranslations: true,
          seriesThreshold: 50
        },
        chart: {
          height: 500
        },
        title: {
          text: 'Daily Mean (Range) Temperature (°C)',
          style: {
            fontSize: '0.85rem'
          }
        },
        rangeSelector: {
          selected: 4,
          buttons: [{
            type: 'month',
            count: 1,
            text: '1m',
            title: 'View 1 month'
          }, {
            type: 'month',
            count: 3,
            text: '3m',
            title: 'View 3 months'
          }, {
            type: 'month',
            count: 6,
            text: '6m',
            title: 'View 6 months'
          }, {
            type: 'year',
            count: 1,
            text: '1y',
            title: 'View 1 year'
          }, {
            type: 'all',
            text: 'All',
            title: 'View all'
          }]
        },
        series: [],
        tooltip: {
          animation: false,
          xDateFormat: '%b %d, %Y',
          pointFormat: 'Daily Mean: <b>{point.y} °C</b>',
          valueDecimals: 1,
          enabled: true,
          shared: false
        },
        navigator: {
          series: []
        },
        xAxis: {
          ordinal: false
        },
        yAxis: {
          opposite: false,
          startOnTick: false,
          endOnTick: false,
          tickAmount: 4
        }
      },
      table: {
        headers: [
          {
            text: 'ID',
            value: 'id',
            align: 'left',
            width: '80px'
          },
          {
            text: 'Period',
            value: 'period',
            align: 'left'
          },
          {
            text: 'Frequency (min)',
            value: 'frequency',
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
      const response = await this.$http.public.get(`/stations/${this.station.id}/series`)
      const series = response.data
      const seriesValues = await Promise.all(series.map(async (d) => {
        const response = await this.$http.public.get(`/series/${d.id}/daily`)
        return {
          ...d,
          values: response.data
        }
      }))

      seriesValues.forEach(s => {
        s.values = s.values.map(v => {
          return [
            (new Date(v.date)).valueOf(),
            v.mean,
            v.min,
            v.max
          ]
        })
      })

      this.series = series
      this.selected = this.series

      this.chart.series = seriesValues.map(s => {
        return [
          {
            name: s.id,
            type: 'line',
            data: s.values.map(d => [d[0], d[1]]),
            visible: true,
            showInNavigator: false
          },
          {
            name: s.id,
            type: 'arearange',
            data: s.values.map(d => [d[0], d[2], d[3]]),
            visible: true
          }
        ]
      }).flat()

      const dailyStats = Array.from(
        d3.rollup(
          seriesValues.map(d => d.values).flat(),
          v => ({
            mean: d3.mean(v, d => d[1]),
            min: d3.min(v, d => d[2]),
            max: d3.max(v, d => d[3])
          }),
          d => d[0]
        )
      ).sort((a, b) => d3.ascending(a[0], b[0]))

      this.chart.navigator.series = [
        {
          name: 'navigator',
          type: 'areaspline',
          visible: true,
          data: dailyStats.map(d => [d[0], d[1].max])
        }
      ]

      this.loading = false
    },
    updateChart () {
      const selectedSeriesIds = this.selected.map(d => d.id)
      if (this.$refs.seriesChart) {
        this.$refs.seriesChart.chart.series.forEach((s) => {
          if (selectedSeriesIds.includes(s.name) || s.name === 'navigator') {
            s.setVisible(true, false)
          } else {
            s.setVisible(false, false)
          }
        })
        this.$refs.seriesChart.chart.redraw(false)
      }
    },
    onInput () {
      this.updateChart()
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
