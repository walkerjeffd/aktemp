<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="pa-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert type="error" v-else-if="series.length === 0" title="No Timeseries Data Available" class="mb-0">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <highcharts :constructor-type="'stockChart'" :options="chart" ref="chart"></highcharts>
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
        <template v-slot:item.start_datetime="{ item }">
          {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
        <template v-slot:item.end_datetime="{ item }">
          {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
      </v-data-table>
      <v-divider class="mb-4"></v-divider>
      <div class="text-right">
        <DownloadButton disabled></DownloadButton>
      </div>
      <!-- <pre>selected: {{ selected }}</pre> -->
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'

import { assignDailyFlags } from '@/lib/utils'

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
            showInLegend: false,
            showInNavigator: false,
            gapSize: 5,
            states: {
              hover: {
                enabled: false
              },
              select: {
                enabled: false
              }
            }
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
          height: 500,
          animation: false
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
          xDateFormat: '%b %e, %Y',
          pointFormat: 'Daily Mean: <b>{point.y} °C</b>',
          valueDecimals: 1,
          enabled: true,
          shared: true,
          split: false
        },
        navigator: {
          series: []
        },
        xAxis: {
          ordinal: false
        },
        yAxis: {
          allowDecimals: false,
          opposite: false,
          startOnTick: false,
          endOnTick: false,
          tickAmount: 8,
          title: {
            text: 'Temperature (degC)'
          }
        },
        legend: {
          enabled: true,
          align: 'right'
        },
        credits: {
          enabled: false
        }
      },
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
      let series = await this.$http.public
        .get(`/stations/${this.station.id}/series`)
        .then(d => d.data)

      series = await Promise.all(
        series.map(async (d) => {
          const values = await this.$http.public
            .get(`/series/${d.id}/daily`)
            .then(d => d.data)
          const flags = await this.$http.public
            .get(`/series/${d.id}/flags`)
            .then(d => d.data)
          const { values: unflaggedValues, flags: flaggedValues } = assignDailyFlags(values, flags)
          return {
            ...d,
            values,
            unflaggedValues,
            flags: flaggedValues
          }
        })
      )

      this.series = series
      this.selected = this.series

      const chartSeries = series.map(s => {
        const flagSeries = s.flags.map(flag => {
          const label = flag.flag_type_id === 'OTHER' ? flag.flag_type_other : flag.flag_type_id
          return [
            {
              id: `daily-flag-mean-${s.id}-${flag.id}`,
              name: `series-${s.id}-flag`,
              seriesId: s.id,
              flag: true,
              type: 'line',
              data: flag.values.map(d => [(new Date(d.date)).valueOf(), d.mean]),
              visible: true,
              showInNavigator: false,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y} °C</b> (Flag: ${label})<br/>`
              },
              linkedTo: 'daily-flag-mean',
              color: 'orangered'
            },
            {
              id: `daily-flag-range-${s.id}-${flag.id}`,
              name: `series-${s.id}-flag`,
              seriesId: s.id,
              flag: true,
              type: 'arearange',
              data: flag.values.map(d => [(new Date(d.date)).valueOf(), d.min, d.max]),
              tooltip: {
                pointFormat: `Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C<br/>Flag: ${label}`,
                valueDecimals: 1
              },
              linkedTo: ':previous',
              showInNavigator: false
            }
          ]
        }).flat()
        return [
          {
            id: `daily-mean-${s.id}`,
            seriesId: s.id,
            type: 'line',
            data: s.unflaggedValues.map(d => [(new Date(d.date)).valueOf(), d.mean]),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: `Series ${s.id}: <b>{point.y} °C</b><br/>`
            }
          },
          {
            id: `daily-range-${s.id}`,
            name: `series-${s.id}`,
            seriesId: s.id,
            type: 'arearange',
            data: s.unflaggedValues.map(d => [(new Date(d.date)).valueOf(), d.min, d.max]),
            visible: true
          },
          ...flagSeries
        ]
      }).flat()
      this.chart.series = [
        {
          id: 'daily-flag-mean',
          name: 'Flagged',
          type: 'line',
          data: [],
          visible: true,
          showInLegend: true,
          color: 'orangered',
          events: {
            hide: () => this.updateNavigator(false),
            show: () => this.updateNavigator(true)
          }
        },
        ...chartSeries
      ]

      const navigatorData = this.getNavigatorData(true)
      this.chart.navigator.series = [
        {
          id: 'navigator',
          type: 'areaspline',
          visible: true,
          color: undefined,
          data: navigatorData.map(d => [(new Date(d[0])).valueOf(), d[1].max])
        }
      ]

      this.loading = false
    },
    getNavigatorData (includeFlags) {
      const selectedIds = this.selected.map(d => d.id)
      return Array.from(
        d3.rollup(
          this.series
            .filter(s => selectedIds.includes(s.id))
            .map(d => includeFlags ? d.values : d.unflaggedValues).flat(),
          v => ({
            mean: d3.mean(v, d => d.mean),
            min: d3.min(v, d => d.min),
            max: d3.max(v, d => d.max)
          }),
          d => d.date
        )
      ).sort((a, b) => d3.ascending(a[0], b[0]))
    },
    updateChart () {
      if (!this.$refs.chart || !this.$refs.chart.chart) return
      const chart = this.$refs.chart.chart
      const flagVisible = chart.get('daily-flag-mean').visible
      const selectedIds = this.selected.map(d => d.id)
      chart.series.forEach((s) => {
        console.log(s.options.seriesId)
        if (s.options.seriesId === undefined) return
        if (selectedIds.includes(s.options.seriesId)) {
          if (s.flag) {
            s.setVisible(flagVisible, false)
          } else {
            s.setVisible(true, false)
          }
        } else {
          s.setVisible(false, false)
        }
      })
      chart.redraw(false)
      this.updateNavigator(flagVisible)
    },
    updateNavigator (includeFlags) {
      if (!this.$refs.chart || !this.$refs.chart.chart) return
      const navigatorData = this.getNavigatorData(includeFlags)
      this.$refs.chart.chart.get('navigator')
        .setData(navigatorData.map(d => [(new Date(d[0])).valueOf(), d[1].max]))
      window.chart = this.$refs.chart.chart
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
