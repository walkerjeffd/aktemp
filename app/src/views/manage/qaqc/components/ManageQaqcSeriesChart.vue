<template>
  <div>
    <Loading v-if="loading" style="height:500px"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data" class="ma-4">{{ error }}</Alert>
    <div v-show="!loading && !error">
      <highcharts :constructor-type="'stockChart'" :options="settings" ref="chart"></highcharts>
      <div class="text--secondary overline ml-12">
        Mode: <strong>{{ mode === 'daily' ? 'Daily Mean and Range' : 'Raw Instantaneous' }}</strong>
      </div>
      <div class="text--secondary caption ml-12"><v-icon x-small>mdi-information</v-icon> Zoom in to see raw instantaneous data (selected period must be &leq; 31 days long).</div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { assignDailyFlags, assignRawFlags } from '@/lib/utils'
const { flagLabel } = require('aktemp-utils/flags')

export default {
  name: 'ManageQaqcSeriesChart',
  props: ['series', 'flags', 'flag', 'zoom', 'chartLoading'],
  data () {
    return {
      loading: false,
      error: null,
      mode: 'daily',
      showFlags: true,
      dailyValues: [],
      rawValues: [],
      settings: {
        chart: {
          height: 500,
          marginLeft: 70,
          zoomType: 'x',
          animation: false,
          events: {
            load: async (e) => {
              this.chart = e.target
              await this.fetchDaily()
            },
            selection: this.onSelect
          }
        },
        plotOptions: {
          series: {
            animation: false,
            showInLegend: false,
            showInNavigator: false,
            gapSize: 2,
            dataGrouping: {
              enabled: false
            },
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
            zIndex: 1,
            lineWidth: 1,
            marker: {
              enabled: false,
              symbol: 'circle'
            },
            states: {
              hover: {
                enabled: true,
                lineWidthPlus: 0,
                marker: {
                  radius: 3
                }
              }
            }
          },
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
              enabled: false,
              states: {
                hover: {
                  enabled: false
                }
              }
            },
            tooltip: {
              pointFormat: 'Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C<br/>',
              valueDecimals: 1
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
        time: {
          getTimezoneOffset: (timestamp) => {
            if (!timestamp) return 0
            return -1 * this.$luxon.DateTime.fromMillis(timestamp).setZone(this.timezone).offset
          }
        },
        legend: {
          enabled: true,
          align: 'right'
        },
        tooltip: {
          animation: false,
          // xDateFormat: '%b %e, %Y',
          valueDecimals: 1,
          enabled: true,
          shared: true,
          split: false
        },
        scrollbar: {
          liveRedraw: false
        },
        navigator: {
          adaptToUpdatedData: false,
          series: {
            id: 'navigator',
            type: 'areaspline',
            visible: true,
            color: undefined,
            data: [],
            gapSize: 0,
            dataGrouping: {
              enabled: false
            }
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
        xAxis: {
          ordinal: false,
          events: {
            afterSetExtremes: this.afterSetExtremes
          }
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
        series: [
          {
            id: 'flag-daily',
            name: 'Flagged',
            type: 'line',
            data: [],
            visible: true,
            showInLegend: true,
            showInNavigator: false,
            color: 'orangered',
            events: {
              hide: () => { this.showFlags = false },
              show: () => { this.showFlags = true }
            }
          },
          {
            id: 'flag-raw',
            name: 'Flagged',
            type: 'line',
            data: [],
            visible: true,
            showInLegend: false,
            showInNavigator: false,
            color: 'orangered',
            events: {
              hide: () => { this.showFlags = false },
              show: () => { this.showFlags = true }
            }
          }
        ],
        credits: {
          enabled: false
        }
      }
    }
  },
  computed: {
    timezone () {
      if (!this.series) return null
      return this.series.station_timezone
    }
  },
  watch: {
    chartLoading () {
      if (!this.chart) return
      if (this.chartLoading) {
        this.chart.showLoading('Loading data from server...')
      } else {
        this.chart.hideLoading()
      }
    },
    'flag.start_datetime' () {
      this.renderFlagPeriods()
    },
    'flag.end_datetime' () {
      this.renderFlagPeriods()
    },
    'flag.id' () {
      this.renderFlagPeriods()
    },
    series () {
      this.fetchDaily()
    },
    dailyValues () {
      this.renderDaily()
    },
    rawValues () {
      this.renderRaw()
    },
    flags () {
      this.renderDaily()
    },
    showFlags () {
      this.updateNavigator()
    },
    mode (value, old) {
      if (!this.chart) return

      const redraw = true

      this.chart.get(`flag-${value}`).update({
        showInLegend: true,
        visible: this.showFlags
      }, redraw)
      this.chart.get(`flag-${old}`).update({
        showInLegend: false,
        visible: this.showFlags
      }, redraw)

      this.chart.update({
        tooltip: {
          xDateFormat: value === 'daily' ? '%b %e, %Y' : '%b %e, %Y %I:%M %p'
        }
      }, redraw)

      this.chart.series.forEach((d, i) => {
        if (!d.options.id) return
        if (d.options.id.startsWith(`${old}-`)) {
          d.setVisible(false, redraw)
        } else if (d.options.id.startsWith(`${value}-`)) {
          if (d.options.flag) {
            d.setVisible(this.showFlags, redraw)
          } else {
            d.setVisible(true, redraw)
          }
        }
      })

      this.chart.redraw()

      this.updateNavigator()
    }
  },
  methods: {
    async afterSetExtremes () {
      if (!this.chart) return
      const extremes = this.chart.xAxis[0].getExtremes()
      if (extremes.min === undefined || extremes.max === undefined) return
      const start = this.$luxon.DateTime.fromMillis(extremes.min)
      const end = this.$luxon.DateTime.fromMillis(extremes.max)
      if (!start.isValid || !end.isValid) return
      const durationDays = end.diff(start, 'days').as('days')

      if (durationDays <= 31) {
        await this.fetchRaw(start.toJSDate(), end.toJSDate())
        this.mode = 'raw'
      } else if (this.mode === 'raw') {
        this.mode = 'daily'
      }
    },
    parseDatetime (x) {
      return this.$luxon.DateTime.fromISO(x, { zone: this.timezone })
    },
    async fetchDaily () {
      this.loading = true
      this.error = null

      try {
        this.dailyValues = await this.$http.restricted
          .get(`/series/${this.series.id}/daily`)
          .then(d => d.data)
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    renderDaily () {
      if (!this.chart) return

      const { values, flags } = assignDailyFlags(this.dailyValues, this.flags)

      // remove existing series
      this.chart.series.map(d => d.options.id)
        .filter(d => d.startsWith('daily-'))
        .forEach(id => this.chart.get(id).remove(false))

      // generate chart series for selected
      const flagSeries = flags.map((flag) => {
        const label = flagLabel(flag)
        return [
          {
            id: `daily-mean-${this.series.id}-flag-${flag.id}`,
            name: `series-${this.series.id}-flag`,
            seriesId: this.series.id,
            flag: true,
            type: 'line',
            data: flag.values.map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]),
            tooltip: {
              pointFormat: 'Mean: <b>{point.y}</b> °C<br/>'
            },
            linkedTo: 'flag-daily',
            color: 'orangered',
            marker: {
              enabled: flag.values.length === 1,
              radius: 3,
              symbol: 'circle'
            }
          },
          {
            id: `daily-range-${this.series.id}-flag-${flag.id}`,
            name: `series-${this.series.id}-flag`,
            seriesId: this.series.id,
            flag: true,
            type: 'arearange',
            data: flag.values.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
            tooltip: {
              pointFormat: `Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C<br/>Flag: ${label}`,
              valueDecimals: 1
            },
            linkedTo: 'flag-daily'
          }
        ]
      }).flat()

      const newSeries = [
        {
          id: `daily-mean-${this.series.id}`,
          type: 'line',
          data: values.map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]),
          visible: true,
          showInNavigator: false,
          tooltip: {
            pointFormat: 'Mean: <b>{point.y}</b> °C<br/>'
          }
        },
        {
          id: `daily-range-${this.series.id}`,
          name: `series-${this.series.id}`,
          seriesId: this.series.id,
          type: 'arearange',
          data: values.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
          visible: true,
          tooltip: {
            pointFormat: 'Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C<br/>'
          },
          linkedTo: ':previous'
        },
        ...flagSeries
      ]
      newSeries.forEach(d => this.chart.addSeries(d, false))

      const extremes = this.chart.xAxis[0].getExtremes()
      if (isFinite(extremes.dataMin) && isFinite(extremes.dataMax)) {
        this.chart.xAxis[0].setExtremes(extremes.dataMin, extremes.dataMax, false)
      }

      this.renderFlagPeriods()
      this.updateNavigator()

      this.loading = false
    },
    async fetchRaw (start, end) {
      if (!this.chart) return

      this.chart.showLoading('Loading data from server...')

      try {
        this.rawValues = await this.$http.restricted
          .get(`/series/${this.series.id}/values?start=${start.toISOString()}&end=${end.toISOString()}`)
          .then(d => d.data)
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.chart.hideLoading()
      }
    },
    renderRaw () {
      if (!this.chart) return

      const { values, flags } = assignRawFlags(this.rawValues, this.flags)

      // remove existing raw series
      this.chart.series.map(d => d.options.id)
        .filter(d => d.startsWith('raw-'))
        .forEach(id => this.chart.get(id).remove(false))

      // generate chart series for selected
      const flagSeries = flags.map(flag => {
        const label = flagLabel(flag)
        return {
          id: `raw-${this.series.id}-flag-${flag.id}`,
          name: `series-${this.series.id}-flag`,
          seriesId: this.series.id,
          flag: true,
          type: 'line',
          data: flag.values.map(d => [this.parseDatetime(d.datetime).valueOf(), d.temp_c]),
          tooltip: {
            pointFormat: `Temperature: <b>{point.y}</b> °C<br/>Flag: <b>${label}</b>`
          },
          linkedTo: 'flag-raw',
          visible: this.showFlags,
          color: 'orangered',
          marker: {
            enabled: flag.values.length === 1,
            radius: 3,
            symbol: 'circle'
          }
        }
      })

      const newSeries = [
        {
          id: `raw-${this.series.id}`,
          seriesId: this.series.id,
          type: 'line',
          data: values.map(d => [this.parseDatetime(d.datetime).valueOf(), d.temp_c]),
          tooltip: {
            pointFormat: 'Temperature: <b>{point.y}</b> °C<br/>'
          }
        },
        ...flagSeries
      ]

      newSeries.forEach(d => this.chart.addSeries(d, true))

      this.chart.redraw()
      this.updateNavigator()

      this.$nextTick(() => this.renderFlagPeriods())

      this.loading = false
    },
    renderFlagPeriods () {
      let bands = this.flags.map(d => {
        let start = this.parseDatetime(d.start_datetime)
        let end = this.parseDatetime(d.end_datetime)
        if (this.mode === 'daily') {
          start = this.parseDatetime(d.start_date)
          end = this.parseDatetime(d.end_date)
        }
        return {
          id: d.id,
          from: start.valueOf(),
          to: end.valueOf(),
          label: { text: d.flag_type_id },
          color: '#EEEEEE',
          events: {
            click: () => this.$emit('click-flag', d)
          }
        }
      })
      if (this.flag) {
        if (this.flag.id) {
          bands = bands.filter(d => d.id !== this.flag.id)
        }
        let start = this.$luxon.DateTime.fromISO(this.flag.start_datetime, { zone: 'UTC' })
        let end = this.$luxon.DateTime.fromISO(this.flag.end_datetime, { zone: 'UTC' })
        if (this.mode === 'daily') {
          start = start.startOf('day')
          end = end.endOf('day')
        }
        bands.push({
          from: start.valueOf(),
          to: end.valueOf(),
          label: {
            text: this.flag.id ? 'SELECTED' : 'NEW'
          },
          color: '#FEEEEE',
          events: {
            click: () => this.$emit('click-flag')
          }
        })
      }
      this.chart.xAxis[0].update({
        plotBands: bands
      })
    },
    updateNavigator () {
      if (!this.chart) return
      let values = []
      if (this.showFlags) {
        values = this.dailyValues
      } else {
        const { values: unflaggedValues } = assignDailyFlags(this.dailyValues, this.flags)
        values = unflaggedValues
      }
      this.chart.get('navigator')
        .setData(values.map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]))
    },
    onSelect (event) {
      if (this.zoom) return
      event.preventDefault()
      let start = this.$luxon.DateTime.fromMillis(event.xAxis[0].min)
      let end = this.$luxon.DateTime.fromMillis(event.xAxis[0].max)
      if (this.mode === 'daily') {
        start = start.startOf('day')
        end = end.endOf('day').plus(1, 'day')
      }
      this.$emit('select', start.toISO(), end.toISO())
    }
  }
}
</script>

<style>

</style>
