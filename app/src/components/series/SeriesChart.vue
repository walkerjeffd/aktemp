Raw<template>
  <div style="width:100%">
    <Loading v-if="loading" style="height:500px"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data" class="mb-0">{{ error }}</Alert>
    <div v-show="!loading && !error">
      <div class="text-h6 font-weight-bold">
        {{ mode === 'daily' ? 'Daily Mean and Range' : 'Instantaneous Measurements' }}
      </div>

      <highcharts :constructor-type="'stockChart'" :options="settings" ref="chart"></highcharts>
      <div class="text--secondary caption body-2">
        <v-icon x-small>mdi-information</v-icon> Click and drag on the top chart or use the handles on the bottom chart to zoom in. To see instantaneous data, zoom in to a period &leq; 31 days. Click "Flagged" in the bottom right corner to hide/show flagged values.
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
const { flagLabel } = require('aktemp-utils/flags')

export default {
  name: 'SeriesChart',
  props: {
    series: Array,
    flags: Array,
    flag: Object,
    brush: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      loading: false,
      error: null,
      about: false,
      mode: 'daily',
      showFlags: true,
      settings: {
        chart: {
          height: 500,
          marginLeft: 70,
          zoomType: 'x',
          animation: false,
          boost: {
            enabled: false
          },
          events: {
            load: async (e) => {
              this.chart = e.target
              window.chart = this.chart
              this.chart.showLoading('Loading data from server...')
              await this.initDaily()
              this.chart.hideLoading()
            },
            selection: this.onBrush
            // redraw: () => console.log('chart:redraw'),
            // render: () => console.log('chart:render')
          }
        },
        plotOptions: {
          series: {
            animation: false,
            showInLegend: false,
            showInNavigator: false,
            gapSize: 0,
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
            // gapSize: 0,
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
            id: 'flagged',
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
      this.initDaily()
    },
    showFlags () {
      this.render()
    },
    flags () {
      // console.log('watch:flags', this.flags)
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
      return [start, end]
    },
    async removeUnselectedSeries () {
      const seriesIds = this.series.map(d => d.id)
      const chartIdsToRemove = this.chart.series
        .filter(d => d.options.seriesId && !seriesIds.includes(d.options.seriesId))
        .map(d => d.options.id)
      // console.log('removeUnselectedSeries', chartIdsToRemove)
      chartIdsToRemove.forEach(id => {
        const series = this.chart.get(id)
        if (series) {
          // console.log(`removeUnselectedSeries: remove(${id})`)
          series.remove(false)
        }
      })
      // console.log('removeUnselectedSeries', this.chart.series.length)
    },
    async afterSetExtremes () {
      // console.log('afterSetExtremes')
      const datetimeRange = this.getDatetimeRange()
      if (!datetimeRange) return

      const durationDays = datetimeRange[1].diff(datetimeRange[0], 'days').as('days')
      // console.log('afterSetExtremes', durationDays, [datetimeRange[0].toJSDate(), datetimeRange[1].toJSDate()])

      if (durationDays <= 32) {
        this.mode = 'raw'
      } else if (this.mode === 'raw') {
        this.mode = 'daily'
      }
      this.render()
    },
    updateFlags () {
      this.series.forEach((s) => {
        // console.log(`updateFlags(${s.id})`)
        if (s.daily && s.daily.values) {
          s.daily.values = this.assignFlags(s, s.daily.values, this.flags || s.flags, 'daily')
          s.daily.series = this.createDailyChartSeries(s)
        }
        if (s.raw && s.raw.values) {
          s.raw.values = this.assignFlags(s, s.raw.values, this.flags || s.flags, 'raw')
          s.raw.series = this.createRawChartSeries(s)
        }
      })
      this.render()
    },
    assignFlags (s, values, flags, mode) {
      if (!flags) return
      // console.log(`assignFlags(${s.id})`, values, flags)
      values.forEach(d => {
        d.flag = []
      })

      if (s.interval === 'CONTINUOUS' && mode === 'daily') {
        flags.forEach(flag => {
          const label = flagLabel(flag)
          const startDate = this.$luxon.DateTime
            .fromISO(flag.start_datetime)
            .setZone(s.station_timezone)
            .toFormat('yyyy-MM-dd')
          const endDate = this.$luxon.DateTime
            .fromISO(flag.end_datetime)
            .setZone(s.station_timezone)
            .toFormat('yyyy-MM-dd')
          values.forEach(d => {
            if (d.date >= startDate && d.date <= endDate) {
              d.flag.push(label)
            }
          })
        })
      } else {
        flags.forEach(flag => {
          const label = flagLabel(flag)
          values.forEach(d => {
            if (d.datetime >= flag.start_datetime && d.datetime <= flag.end_datetime) {
              d.flag.push(label)
            }
          })
        })
      }

      values.forEach(d => {
        d.flag = d.flag.join(',')
      })
      return values
    },
    async initDaily () {
      this.removeUnselectedSeries()

      // fetch daily and flag data for each series (if not exist)
      await Promise.all(this.series.map(async (s) => {
        s.daily = {}
        const values = await this.fetchDaily(s)
        if (this.flags) {
          s.daily.values = this.assignFlags(s, values, this.flags, 'daily')
        } else {
          s.daily.values = this.assignFlags(s, values, s.flags, 'daily')
        }
        s.daily.series = this.createDailyChartSeries(s)
        if (s.raw) {
          delete s.raw
        }
      }))

      this.render()
    },
    async fetchDaily (series) {
      if (series.daily && series.daily.values) return series.daily.values
      // console.log('fetchDaily', series.id)

      if (series.interval === 'CONTINUOUS') {
        const values = await this.$http.public
          .get(`/series/${series.id}/daily`)
          .then(d => d.data)

        return values
      } else if (series.interval === 'DISCRETE') {
        const values = await this.$http.public
          .get(`/series/${series.id}/values`)
          .then(d => d.data)

        values.forEach(d => {
          d.date = this.$luxon.DateTime.fromISO(d.datetime).setZone(series.station_timezone).toFormat('yyyy-MM-dd')
          d.min_temp_c = d.temp_c
          d.mean_temp_c = d.temp_c
          d.max_temp_c = d.temp_c
        })

        return values
      }

      return []
    },
    createDailyChartSeries (series) {
      if (series.daily && series.daily.series) return series.daily.series

      let chartSeries = []
      if (series.interval === 'CONTINUOUS') {
        // Option 1: Chunks
        // const v = series.daily.values
        // const chunks = []
        // v.forEach((d, i) => {
        //   d.date = this.parseDatetime(d.date)
        //   if (i === 0) {
        //     // first chunk
        //     chunks.push({
        //       flag: !!d.flag,
        //       values: [d]
        //     })
        //   } else if (!!v[i].flag !== !!v[i - 1].flag) {
        //     // new chunk
        //     // chunks[chunks.length - 1].values.push(d)
        //     chunks.push({
        //       flag: !!d.flag,
        //       values: [d]
        //       // values: [v[i - 1], d]
        //     })
        //   } else {
        //     chunks[chunks.length - 1].values.push(d)
        //   }
        // })

        // chartSeries = chunks.map((chunk, i) => {
        //   const s = {
        //     id: `${series.id}-daily-${i}-mean`,
        //     seriesId: series.id,
        //     interval: series.interval,
        //     mode: 'daily',
        //     type: 'line',
        //     data: chunk.values.map(d => ({
        //       x: d.date.valueOf(),
        //       y: d.mean_temp_c,
        //       flag: d.flag
        //     })),
        //     visible: true,
        //     showInNavigator: false,
        //     tooltip: {
        //       pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
        //     },
        //     marker: {
        //       enabled: chunk.values.length === 1,
        //       radius: 2,
        //       symbol: 'circle'
        //     }
        //   }
        //   if (chunk.flag) {
        //     s.flag = true
        //     s.color = 'orangered'
        //     s.tooltip = {
        //       pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>{point.flag}</b>)`
        //     }
        //   }
        //   return s
        // })
        // console.log(chunks)

        // Option 2: Connected Chunks
        const v = series.daily.values
        const chunks = []
        v.forEach((d, i) => {
          d.date = this.parseDatetime(d.date)
          if (i === 0) {
            // first chunk
            chunks.push({
              flag: !!d.flag,
              values: [d]
            })
          } else if (!!v[i].flag !== !!v[i - 1].flag) {
            // new chunk
            if (v[i - 1].flag) {
              chunks[chunks.length - 1].values.push(d)
              chunks.push({
                flag: !!d.flag,
                values: [d]
              })
            } else {
              chunks.push({
                flag: !!d.flag,
                values: [v[i - 1], d]
              })
            }
          } else {
            chunks[chunks.length - 1].values.push(d)
          }
        })

        chartSeries = chunks.map((chunk, i) => {
          const mean = {
            id: `${series.id}-daily-${i}-mean`,
            seriesId: series.id,
            interval: series.interval,
            mode: 'daily',
            type: 'line',
            data: chunk.values.map(d => ([d.date.valueOf(), d.mean_temp_c])),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: null
            }
          }
          const range = {
            id: `${series.id}-daily-${i}-range`,
            seriesId: series.id,
            interval: series.interval,
            mode: 'daily',
            type: 'arearange',
            data: chunk.values.map(d => ([d.date.valueOf(), d.min_temp_c, d.max_temp_c])),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: null
            }
          }
          if (chunk.flag) {
            mean.color = 'orangered'
            mean.flag = true
            range.flag = true
          }

          return [mean, range]
        }).flat()

        chartSeries.push({
          id: `${series.id}-daily-tooltip`,
          seriesId: series.id,
          interval: series.interval,
          mode: 'daily',
          type: 'line',
          data: v.filter(d => !d.flag).map(d => ([d.date.valueOf(), d.mean_temp_c])),
          visible: true,
          showInNavigator: false,
          lineWidth: 0,
          tooltip: {
            pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
          }
        })
        chartSeries.push({
          id: `${series.id}-daily-tooltip-flag`,
          seriesId: series.id,
          interval: series.interval,
          flag: true,
          mode: 'daily',
          type: 'line',
          data: v.filter(d => !!d.flag).map(d => ({
            x: d.date.valueOf(),
            y: d.mean_temp_c,
            flag: d.flag
          })),
          visible: true,
          showInNavigator: false,
          turboThreshold: 0,
          tooltip: {
            pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>{point.flag}</b>)`
          },
          lineWidth: 0,
          color: 'orangered'
        })

        // Option 3: Flag Points
        // const v = series.daily.values
        // chartSeries = [
        //   {
        //     id: `${series.id}-daily-mean`,
        //     seriesId: series.id,
        //     interval: series.interval,
        //     mode: 'daily',
        //     type: 'line',
        //     data: v.map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]),
        //     visible: true,
        //     showInNavigator: false,
        //     tooltip: {
        //       pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
        //     },
        //     marker: {
        //       enabled: v.length === 1,
        //       radius: 2,
        //       symbol: 'circle'
        //     }
        //   },
        //   {
        //     id: `${series.id}-daily-range`,
        //     seriesId: series.id,
        //     interval: series.interval,
        //     mode: 'daily',
        //     type: 'arearange',
        //     data: v.map(d => [this.parseDatetime(d.date).valueOf(), d.min_temp_c, d.max_temp_c]),
        //     visible: true,
        //     showInNavigator: false,
        //     tooltip: {
        //       pointFormat: null
        //     },
        //     marker: {
        //       enabled: v.length === 1,
        //       radius: 2,
        //       symbol: 'circle'
        //     }
        //   },
        //   {
        //     id: `${series.id}-daily-flag`,
        //     seriesId: series.id,
        //     interval: series.interval,
        //     mode: 'daily',
        //     flag: true,
        //     type: 'line',
        //     data: v.filter(d => !!d.flag).map(d => [this.parseDatetime(d.date).valueOf(), d.mean_temp_c]),
        //     visible: true,
        //     showInNavigator: false,
        //     tooltip: {
        //       pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
        //     },
        //     lineWidth: 0,
        //     color: 'orangered',
        //     marker: {
        //       enabled: true,
        //       radius: 3,
        //       symbol: 'circle'
        //     }
        //   }
        // ]
      } else if (series.interval === 'DISCRETE') {
        chartSeries = [
          {
            id: `${series.id}-discrete-value`,
            seriesId: series.id,
            interval: series.interval,
            type: 'line',
            data: series.daily.values
              .filter(d => !d.flag)
              .map(d => [this.parseDatetime(d.datetime.substr(0, 10)).valueOf(), d.temp_c]),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
            },
            lineWidth: 0,
            marker: {
              enabled: true,
              radius: 3,
              symbol: 'circle'
            }
          },
          {
            id: `${series.id}-discrete-flag`,
            seriesId: series.id,
            interval: series.interval,
            flag: true,
            type: 'line',
            data: series.daily.values
              .filter(d => !!d.flag)
              .map(d => ({
                x: this.parseDatetime(d.datetime.substr(0, 10)).valueOf(),
                y: d.temp_c,
                flag: d.flag
              })),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>{point.flag}</b>)`
            },
            lineWidth: 0,
            marker: {
              enabled: true,
              radius: 3,
              symbol: 'circle'
            },
            color: 'orangered'
          }
        ]
      }
      return chartSeries
    },
    renderDailySeries (series) {
      if (!series.daily || !series.daily.series) return
      // console.log(`renderDailySeries(${series.id})`)
      series.daily.series.forEach(d => {
        let chartSeries = this.chart.get(d.id)
        // console.log(`renderDailySeries(${d.id}): get `, chartSeries)
        if (!chartSeries) {
          // console.log(`renderDailySeries(${d.id}): add `, d)
          this.chart.addSeries(d, false)
          chartSeries = this.chart.get(d.id)
        } else {
          chartSeries.setData(d.data, false)
        }
        if (d.interval === 'DISCRETE') {
          if (!d.flag || this.showFlags) {
            // console.log(`renderDailySeries(${d.id}): visible=true`)
            chartSeries.setVisible(true, false)
          } else {
            // console.log(`renderDailySeries(${d.id}): visible=false`)
            chartSeries.setVisible(false, false)
          }
        } else if (this.mode === 'daily' && (!d.flag || this.showFlags)) {
          // console.log(`renderDailySeries(${d.id}): visible=true`)
          this.chart.get(d.id).setVisible(true, false)
        } else {
          // console.log(`renderDailySeries(${d.id}): visible=false`)
          chartSeries.setVisible(false, false)
        }
      })
    },
    async fetchRaw (series, start, end) {
      if (series.raw &&
          series.raw.values &&
          series.raw.start.valueOf() === start.valueOf() &&
          series.raw.end.valueOf() === end.valueOf()
      ) return series.raw.values

      // console.log(`fetchRaw(${series.id})`, start.toISOString(), end.toISOString())

      const values = await this.$http.public
        .get(`/series/${series.id}/values?start=${start.toISOString()}&end=${end.toISOString()}`)
        .then(d => d.data)

      return values
    },
    createRawChartSeries (series) {
      const v = series.raw.values
      console.log(v)
      const chunks = []
      v.forEach((d, i) => {
        // d.datetime = this.parseDatetime(d.datetime)
        if (i === 0) {
          // first chunk
          chunks.push({
            flag: !!d.flag,
            values: [d]
          })
        } else if (!!v[i].flag !== !!v[i - 1].flag) {
          // new chunk
          if (v[i - 1].flag) {
            chunks[chunks.length - 1].values.push(d)
            chunks.push({
              flag: !!d.flag,
              values: [d]
            })
          } else {
            chunks.push({
              flag: !!d.flag,
              values: [v[i - 1], d]
            })
          }
        } else {
          chunks[chunks.length - 1].values.push(d)
        }
      })
      console.log(chunks)

      const chartSeries = chunks.map((chunk, i) => {
        const value = {
          id: `${series.id}-raw-${i}`,
          seriesId: series.id,
          interval: series.interval,
          mode: 'raw',
          type: 'line',
          data: chunk.values.map(d => ([this.parseDatetime(d.datetime).valueOf(), d.temp_c])),
          visible: true,
          showInNavigator: false,
          tooltip: {
            pointFormat: null
          }
        }
        if (chunk.flag) {
          value.color = 'orangered'
          value.flag = true
        }

        return value
      })

      chartSeries.push({
        id: `${series.id}-raw-tooltip`,
        seriesId: series.id,
        interval: series.interval,
        mode: 'raw',
        type: 'line',
        data: v.filter(d => !d.flag).map(d => ([this.parseDatetime(d.datetime).valueOf(), d.temp_c])),
        visible: true,
        showInNavigator: false,
        lineWidth: 0,
        tooltip: {
          pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
        }
      })
      chartSeries.push({
        id: `${series.id}-raw-tooltip-flag`,
        seriesId: series.id,
        interval: series.interval,
        flag: true,
        mode: 'raw',
        type: 'line',
        data: v.filter(d => !!d.flag).map(d => ({
          x: this.parseDatetime(d.datetime).valueOf(),
          y: d.temp_c,
          flag: d.flag
        })),
        visible: true,
        showInNavigator: false,
        turboThreshold: 0,
        tooltip: {
          pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>{point.flag}</b>)`
        },
        lineWidth: 0,
        color: 'orangered'
      })
      // const values = series.raw.values.filter(d => !d.flag)
      // const flaggedValues = series.raw.values.filter(d => !!d.flag)
      // const valuesSeries = {
      //   id: `${series.id}-raw-values`,
      //   seriesId: series.id,
      //   interval: series.interval,
      //   mode: 'raw',
      //   type: 'line',
      //   data: v.map(d => [this.parseDatetime(d.datetime).valueOf(), d.temp_c]),
      //   visible: true,
      //   showInNavigator: false,
      //   tooltip: {
      //     pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
      //   },
      //   marker: {
      //     enabled: values.length === 1,
      //     radius: 3,
      //     symbol: 'circle'
      //   }
      // }
      // const flaggedSeries = {
      //   id: `${series.id}-raw-flag`,
      //   seriesId: series.id,
      //   interval: series.interval,
      //   mode: 'raw',
      //   flag: true,
      //   type: 'line',
      //   data: flaggedValues.map(d => ({
      //     x: this.parseDatetime(d.datetime).valueOf(),
      //     y: d.temp_c,
      //     flag: d.flag
      //   })),
      //   visible: true,
      //   showInNavigator: false,
      //   tooltip: {
      //     pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>{point.flag}</b>)`
      //   },
      //   marker: {
      //     enabled: values.length === 1,
      //     radius: 3,
      //     symbol: 'circle'
      //   },
      //   color: 'orangered'
      // }
      // return [
      //   valuesSeries,
      //   flaggedSeries
      // ]
      return chartSeries
    },
    renderRawSeries (series) {
      if (!series.raw || !series.raw.series) return
      // console.log(`renderRawSeries(${series.id})`)
      console.log(series.raw.series)
      const ids = this.chart.series.filter(d => d.options.mode === 'raw').map(d => d.options.id)
      console.log('remove', ids)
      for (const id of ids) {
        this.chart.get(id).remove(false)
      }
      series.raw.series.forEach(d => {
        let chartSeries = this.chart.get(d.id)
        if (chartSeries) {
          chartSeries.remove(false)
        }
        // console.log(`renderRawSeries(${d.id}): get `, chartSeries)
        this.chart.addSeries(d, false)
        chartSeries = this.chart.get(d.id)
        if (this.mode === 'raw' && (!d.flag || this.showFlags)) {
          // console.log(`renderRawSeries(${d.id}): visible=true`)
          chartSeries.setVisible(true, false)
        } else {
          // console.log(`renderRawSeries(${d.id}): visible=false`)
          chartSeries.setVisible(false, false)
        }
      })
    },
    async initRaw () {
      console.log('initRaw()')

      const datetimeRange = this.getDatetimeRange()
      if (!datetimeRange) return

      const start = datetimeRange[0].toJSDate()
      const end = datetimeRange[1].toJSDate()

      this.chart.showLoading('Loading data from server...')
      await Promise.all(this.series.map(async (s) => {
        if (s.interval === 'DISCRETE') return

        if (!(s.raw && s.raw.start === start && s.raw.end === end)) {
          const values = await this.fetchRaw(s, start, end)

          s.raw = {
            start,
            end
          }
          if (this.flags) {
            s.raw.values = this.assignFlags(s, values, this.flags, 'raw')
          } else {
            s.raw.values = this.assignFlags(s, values, s.flags, 'raw')
          }
          s.raw.series = this.createRawChartSeries(s)
        }
      }))
      this.chart.hideLoading()
    },
    renderSeries (s) {
      this.renderDailySeries(s)
      this.renderRawSeries(s)
    },
    renderBands () {
      // console.log('renderBands', this.flags)
      let bands = []
      if (this.flags) {
        bands = this.flags.map(d => {
          const start = this.parseDatetime(d.start_datetime)
          const end = this.parseDatetime(d.end_datetime)
          // if (this.mode === 'daily') {
          //   start = this.parseDatetime(d.start_date)
          //   end = this.parseDatetime(d.end_date)
          // }
          return {
            id: d.id,
            from: start.valueOf(),
            to: end.valueOf(),
            label: { text: d.flag_type_id },
            color: '#EEEEEE',
            events: {
              click: () => {
                if (this.brush) return
                this.$emit('select', d)
              }
            }
          }
        })
      }

      if (this.flag) {
        if (this.flag.id) {
          bands = bands.filter(d => d.id !== this.flag.id)
        }
        const start = this.parseDatetime(this.flag.start_datetime)
        const end = this.parseDatetime(this.flag.end_datetime)
        // if (this.mode === 'daily') {
        //   start = start.startOf('day')
        //   end = end.endOf('day')
        // }
        console.log(start.toISO(), end.toISO())
        bands.push({
          from: start.valueOf(),
          to: end.valueOf(),
          label: {
            text: this.flag.id ? 'SELECTED' : 'NEW'
          },
          color: '#FEEEEE',
          events: {
            click: () => {
              if (this.brush) return
              this.$emit('select')
            }
          }
        })
      }
      this.chart.xAxis[0].update({
        plotBands: bands
      })
    },
    async render () {
      // console.log('render', this.mode)

      if (this.mode === 'raw') {
        await this.initRaw()
      }

      this.series.forEach(this.renderSeries)
      this.renderBands()

      this.updateNavigator()
      this.chart.redraw()
    },

    updateNavigator () {
      // console.log('updateNavigator')
      if (!this.chart) return

      const values = this.series
        .filter(d => !!d.daily && !!d.daily.values)
        .map(d => this.showFlags ? d.daily.values : d.daily.values.filter(d => !d.flag)).flat()

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

      this.chart.get('navigator').setData(data, false)
    },

    onBrush (event) {
      if (!this.brush) return
      event.preventDefault()
      let start = this.$luxon.DateTime.fromMillis(event.xAxis[0].min, { zone: this.timezone })
      let end = this.$luxon.DateTime.fromMillis(event.xAxis[0].max, { zone: this.timezone })
      console.log('onBrush', start.toISO(), end.toISO())
      if (this.mode === 'daily') {
        start = start.startOf('day')
        end = end.endOf('day').plus(1, 'day').minus(1, 'minute')
        console.log('daily', start.toISO(), end.toISO())
      }
      this.$emit('brush', start.toISO(), end.toISO())
    }
  }
}
</script>

<style>

</style>
