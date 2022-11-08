<template>
  <div style="width:100%">
    <Loading v-if="loading" style="height:500px"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data" class="mb-0">{{ error }}</Alert>
    <div v-show="!loading && !error">
      <highcharts :constructor-type="'stockChart'" :options="settings" ref="chart"></highcharts>
      <div class="text--secondary overline ml-12">
        Mode: <strong>{{ mode === 'daily' ? 'Daily Mean and Range' : 'Raw Instantaneous' }}</strong>
      </div>
      <div class="text--secondary caption ml-12"><v-icon x-small>mdi-information</v-icon> Zoom in to see raw instantaneous data (selected period must be &leq; 31 days long). Click "Flagged" in the bottom right corner to hide/show flagged values.</div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { assignDailyFlags, assignRawFlags } from '@/lib/utils'
const { flagLabel } = require('aktemp-utils/flags')

export default {
  name: 'SeriesChart',
  props: ['series'],
  data () {
    return {
      loading: false,
      error: null,
      datetimeRange: null,
      mode: 'daily',
      showFlags: true,
      settings: {
        chart: {
          height: 500,
          marginLeft: 70,
          zoomType: 'x',
          animation: false,
          events: {
            load: (e) => {
              this.chart = e.target
              window.chart = this.chart
              this.render()
            }
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
              },
              inactive: {
                opacity: 1
              }
            }
          },
          line: {
            zIndex: 1,
            lineWidth: 1,
            marker: {
              enabled: false
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
              enabled: false
            },
            tooltip: {
              pointFormat: null
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
          shared: false,
          split: true
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
            afterSetExtremes: this.updateDatetimeRange
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
      if (!this.series || this.series.length === 0) return null
      return this.series[0].station_timezone
    }
  },
  watch: {
    async series () {
      await this.renderDaily()
      await this.render()
    },
    showFlags () {
      this.updateNavigator()
    },
    mode (value, old) {
      // console.log('watch:mode', value, old)
      if (!this.chart) return

      this.chart.get(`flag-${value}`).update({
        showInLegend: true,
        visible: this.showFlags
      }, false)
      this.chart.get(`flag-${old}`).update({
        showInLegend: false,
        visible: this.showFlags
      }, false)

      this.chart.update({
        tooltip: {
          xDateFormat: value === 'daily' ? '%b %e, %Y' : '%b %e, %Y %I:%M %p'
        }
      }, false)

      this.render()
    }
  },
  methods: {
    parseDatetime (x) {
      return this.$luxon.DateTime.fromISO(x, { zone: this.timezone })
    },
    getDatetimeRange () {
      // console.log('getDatetimeRange')
      if (!this.chart) return

      const extremes = this.chart.xAxis[0].getExtremes()
      // console.log('extremes', extremes)
      if (extremes.min === undefined || extremes.max === undefined) return

      const start = this.$luxon.DateTime.fromMillis(extremes.min)
      const end = this.$luxon.DateTime.fromMillis(extremes.max)
      if (!start.isValid || !end.isValid) return
      // console.log('getDatetimeRange', start.toJSDate(), end.toJSDate())
      return [start, end]
    },
    hideAllSeries () {
      // console.log('hideAllSeries')
      this.chart.series
        .filter(d => !!d.options.mode)
        .forEach(d => this.chart.get(d.options.id).setVisible(false, false))
    },
    async updateDatetimeRange () {
      const datetimeRange = this.getDatetimeRange()
      if (!datetimeRange) return

      const durationDays = datetimeRange[1].diff(datetimeRange[0], 'days').as('days')
      // console.log('updateDatetimeRange', durationDays, [datetimeRange[0].toJSDate(), datetimeRange[1].toJSDate()])

      if (durationDays <= 31) {
        this.mode = 'raw'
        if (this.datetimeRange &&
            (this.datetimeRange[0] !== datetimeRange[0].valueOf() ||
             this.datetimeRange[1] !== datetimeRange[1].valueOf())
        ) {
          this.render()
        }
      } else if (this.mode === 'raw') {
        this.mode = 'daily'
      }
    },
    async renderDaily () {
      // console.log('renderDaily')

      await Promise.all(this.series.map(async (series) => {
        if (!series.daily) {
          // console.log('fetching', series.id)
          const values = await this.$http.public
            .get(`/series/${series.id}/daily`)
            .then(d => d.data)
          series.flags = await this.$http.public
            .get(`/series/${series.id}/flags`)
            .then(d => d.data)
          const { values: unflaggedValues, flags: dailyFlags } = assignDailyFlags(values, series.flags)

          const chartFlagSeries = dailyFlags.map((flag) => {
            const label = flagLabel(flag)
            const seriesMean = {
              id: `daily-mean-${series.id}-flag-${flag.id}`,
              seriesId: series.id,
              mode: 'daily',
              flag: true,
              type: 'line',
              data: flag.values.map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]),
              tooltip: {
                pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>${label}</b>)`
              },
              linkedTo: 'flag-daily',
              color: 'orangered',
              marker: {
                enabled: flag.values.length === 1 || series.interval === 'DISCRETE',
                radius: 3,
                symbol: 'circle'
              }
            }
            if (series.interval === 'DISCRETE') {
              seriesMean.lineWidth = 0
            }
            let seriesRange
            if (series.interval === 'CONTINUOUS') {
              seriesRange = {
                id: `daily-range-${series.id}-flag-${flag.id}`,
                seriesId: series.id,
                mode: 'daily',
                flag: true,
                type: 'arearange',
                data: flag.values.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
                linkedTo: `daily-mean-${series.id}-flag-${flag.id}`
              }
            } else if (series.interval === 'DISCRETE') {
              seriesRange = {
                id: `daily-range-${series.id}-flag-${flag.id}`,
                seriesId: series.id,
                mode: 'daily',
                flag: true,
                type: 'columnrange',
                tooltip: {
                  pointFormat: null
                },
                data: flag.values.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
                linkedTo: `daily-mean-${series.id}-flag-${flag.id}`
              }
            }
            return [seriesMean, seriesRange]
          }).flat()

          const seriesMean = {
            id: `daily-mean-${series.id}`,
            seriesId: series.id,
            mode: 'daily',
            type: 'line',
            data: unflaggedValues.map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
            },
            marker: {
              enabled: unflaggedValues.length === 1 || series.interval === 'DISCRETE',
              radius: 3,
              symbol: 'circle'
            }
          }
          if (series.interval === 'DISCRETE') {
            seriesMean.lineWidth = 0
          }
          let seriesRange
          if (series.interval === 'CONTINUOUS') {
            seriesRange = {
              id: `daily-range-${series.id}`,
              seriesId: series.id,
              mode: 'daily',
              type: 'arearange',
              data: unflaggedValues.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
              visible: true,
              linkedTo: `daily-mean-${series.id}`
            }
          } else if (series.interval === 'DISCRETE') {
            seriesRange = {
              id: `daily-range-${series.id}`,
              seriesId: series.id,
              mode: 'daily',
              type: 'columnrange',
              data: unflaggedValues.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
              visible: true,
              tooltip: {
                pointFormat: null
              },
              linkedTo: `daily-mean-${series.id}`
            }
          }

          const chartSeries = [
            seriesMean,
            seriesRange,
            ...chartFlagSeries
          ]

          series.daily = Object.freeze({
            values,
            unflaggedValues,
            flags: dailyFlags,
            chartSeries
          })
        }

        series.daily.chartSeries.forEach(d => {
          // console.log('render:', d.id)
          const chartSeries = this.chart.get(d.id)
          if (!chartSeries) {
            this.chart.addSeries(d, false)
            if (!this.showFlags && d.flag) {
              this.chart.get(d.id).setVisible(false, false)
            } else {
              this.chart.get(d.id).setVisible(true, false)
            }
          } else if (!d.flag || this.showFlags) {
            chartSeries.setVisible(true, false)
          }
        })
      }))
      this.chart.redraw()
    },
    async renderRaw () {
      // console.log('renderRaw', this.series)
      const datetimeRange = this.getDatetimeRange()
      if (!datetimeRange) return

      const start = datetimeRange[0].toJSDate()
      const end = datetimeRange[1].toJSDate()
      await Promise.all(this.series.map(async (series) => {
        // console.log('series', series.id, series.raw && series.raw.start.valueOf() === start.valueOf())
        if (!series.raw ||
          series.raw.start.valueOf() !== start.valueOf() ||
          series.raw.end.valueOf() !== end.valueOf()
        ) {
          const values = await this.$http.public
            .get(`/series/${series.id}/values?start=${start.toISOString()}&end=${end.toISOString()}`)
            .then(d => d.data)

          const { values: unflaggedValues, flags } = assignRawFlags(values, series.flags || [])

          const existingChartSeriesIds = this.chart.series
            .filter(d => d.options.mode === 'raw' && d.options.seriesId === series.id)
            .map(d => d.options.id)
          existingChartSeriesIds.forEach(id => {
            const chartSeries = this.chart.get(id)
            if (chartSeries) {
              chartSeries.remove(false)
            }
          })

          const chartFlagSeries = flags.map(flag => {
            const label = flagLabel(flag)
            const data = flag.values
              .map(d => [this.parseDatetime(d.datetime).valueOf(), d.temp_c])
            return {
              id: `raw-${series.id}-flag-${flag.id}`,
              seriesId: series.id,
              mode: 'raw',
              flag: true,
              type: 'line',
              gapSize: 0,
              data,
              tooltip: {
                pointFormat: `Series ${series.id}: <b>{point.y}</b> °C<br/>Flag: ${label}`
              },
              linkedTo: 'flag-raw',
              visible: this.showFlags,
              color: 'orangered',
              marker: {
                enabled: flag.values.length === 1 || series.interval === 'DISCRETE',
                radius: 5,
                symbol: 'circle'
              }
            }
          })

          const chartSeries = [
            {
              id: `raw-${series.id}`,
              seriesId: series.id,
              mode: 'raw',
              type: 'line',
              gapSize: 0,
              data: unflaggedValues.map(d => [this.parseDatetime(d.datetime).valueOf(), d.temp_c]),
              tooltip: {
                pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
              },
              marker: {
                enabled: unflaggedValues.length === 1 || series.interval === 'DISCRETE',
                radius: 5,
                symbol: 'circle'
              }
            },
            ...chartFlagSeries
          ]

          series.raw = Object.freeze({
            start,
            end,
            values,
            unflaggedValues,
            flags,
            chartSeries
          })
        }

        series.raw.chartSeries.forEach(d => {
          // console.log(`raw chartSeries(${d.id})`)
          const chartSeries = this.chart.get(d.id)
          if (!chartSeries) {
            // console.log(`raw chartSeries(${d.id}): add`)
            this.chart.addSeries(d, false)
            if (!this.showFlags && d.flag) {
              // console.log(`raw chartSeries(${d.id}): visible=false`)
              this.chart.get(d.id).setVisible(false, false)
            } else {
              // console.log(`raw chartSeries(${d.id}): visible=true`)
              this.chart.get(d.id).setVisible(true, false)
            }
          } else if (!d.flag || this.showFlags) {
            // console.log(`raw chartSeries(${d.id}): visible=true`)
            chartSeries.setVisible(true, false)
          }
        })
        return series
      }))
      this.chart.redraw()
    },
    async render () {
      // console.log('render', this.mode)

      this.chart.showLoading('Loading data from server...')

      this.hideAllSeries()

      if (this.mode === 'daily') {
        await this.renderDaily()
      } else {
        await this.renderRaw()
      }

      this.updateNavigator()
      this.chart.hideLoading()
    },
    updateNavigator () {
      // console.log('updateNavigator')
      if (!this.chart) return

      const values = this.series
        .filter(d => !!d.daily)
        .map(d => this.showFlags ? d.daily.values : d.daily.unflaggedValues).flat()

      const data = Array.from(
        d3.rollup(
          values,
          v => ({
            mean: d3.mean(v, d => d.mean_temp_c),
            min: d3.min(v, d => d.min_temp_c),
            max: d3.max(v, d => d.max_temp_c)
          }),
          d => d.date
        )
      ).sort((a, b) => d3.ascending(a[0], b[0]))
        .map(d => [this.parseDatetime(d[0]).valueOf(), d[1].max])

      this.chart.get('navigator').setData(data)

      const datetimeRange = this.getDatetimeRange()
      if (datetimeRange) {
        this.datetimeRange = datetimeRange.map(d => d.toJSDate())
      }
    }
  }
}
</script>

<style>

</style>
