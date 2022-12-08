<template>
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
    <div v-if="debug">
      <v-divider class="my-4"></v-divider>
      <div class="d-flex">
        <v-btn color="default" outlined @click="updateSeriesDebug">Update Series Debug</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="default" outlined @click="showDebug = !showDebug">Show/Hide</v-btn>
      </div>
      <div v-if="showDebug" class="mt-4">
        <pre>timezone: {{ timezone }}</pre>
        <pre>mode: {{ mode }}</pre>
        <pre>showFlags: {{ showFlags }}</pre>
        <pre>series: n={{ series.length }}</pre>
        <pre style="white-space:pre">seriesDebug: {{ JSON.stringify(seriesDebug, null, 2) }}</pre>
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
      debug: false,
      showDebug: true,
      seriesDebug: [],
      loading: false,
      error: null,
      about: false,
      mode: 'daily',
      showFlags: true,
      navData: [],
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
            selection: this.onBrush
            // load: () => console.log('chart:load'),
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
        loading: {
          style: {
            position: 'absolute',
            backgroundColor: '#ffffff',
            opacity: 1,
            textAlign: 'center'
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
            color: undefined,
            data: [],
            // gapSize: 0,
            dataGrouping: {
              enabled: false
            },
            // visible: true,
            showInNavigator: true
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
          minRange: 24 * 3600 * 1000,
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
      console.log('watch:series', this.series)
      this.init()
    },
    showFlags () {
      console.log('watch:showFlags', this.showFlags)
      this.updateNavigator()
      this.render()
    },
    flags () {
      console.log('watch:flags', this.flags)
      this.updateFlags()
      this.updateNavigator()
      this.renderDaily(true)
      this.render(true)
    },
    flag: {
      handler () {
        this.renderBands()
      },
      deep: true
    }
  },
  // beforeMount () {
  //   console.log('beforeMount()', this.series)
  // },
  mounted () {
    console.log('mounted()', this.series)
    this.chart = this.$refs.chart.chart
    window.chart = this.chart
    this.init()
  },
  // beforeUpdate () {
  //   console.log('beforeUpdate()', this.series)
  // },
  // updated () {
  //   console.log('updated()', this.series)
  // },
  // beforeDestroy () {
  //   console.log('beforeDestroy()', this.series, this.chart)
  // },
  // destroyed () {
  //   console.log('destroyed()', this.series)
  // },
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
      const ids = this.chart.series
        .filter(d => d.options.seriesId && !seriesIds.includes(d.options.seriesId))
        .map(d => d.options.id)
      console.log('removeUnselectedSeries()', ids)
      ids.forEach(id => {
        const series = this.chart.get(id)
        if (series) {
          console.log(`removeUnselectedSeries: remove(${id})`)
          series.remove(false)
        }
      })
      console.log('removeUnselectedSeries', this.chart.series.length)
    },
    async afterSetExtremes () {
      console.log('afterSetExtremes()')
      this.render()
    },
    getDiscreteChunks (values) {
      console.log(values)
      return [
        {
          flag: false,
          values: values.filter(d => !d.flag)
        }, {
          flag: true,
          values: values.filter(d => !!d.flag)
        }
      ]
    },
    getContinuousChunks (values, accessor = 'datetime') {
      console.log('getContinuousChunks()', values.length)
      const chunks = []
      values.forEach((d, i) => {
        if (i === 0) {
          // create first chunk
          chunks.push({
            flag: !!d.flag,
            values: [d]
          })
        } else if (!!values[i].flag !== !!values[i - 1].flag) {
          // create new chunk at flag boundary
          if (values[i - 1].flag) {
            chunks[chunks.length - 1].values.push(d)
            chunks.push({
              flag: !!d.flag,
              values: [d]
            })
          } else {
            chunks.push({
              flag: !!d.flag,
              values: [values[i - 1], d]
            })
          }
        } else if (values[i][accessor].diff(values[i - 1][accessor]).as('days') > 1.05) {
          // create new chunk after gap
          chunks.push({
            flag: !!d.flag,
            values: [d]
          })
        } else {
          // continue chunk
          chunks[chunks.length - 1].values.push(d)
        }
      })
      return chunks

      // chartSeries = chunks.map((chunk, i) => {
      //   const mean = {
      //     id: `${series.id}-daily-${i}-mean`,
      //     seriesId: series.id,
      //     interval: series.interval,
      //     mode: 'daily',
      //     type: 'line',
      //     data: chunk.values.map(d => ([d.date.valueOf(), d.mean_temp_c])),
      //     visible: true,
      //     showInNavigator: false,
      //     tooltip: {
      //       pointFormat: null
      //     }
      //   }
      //   const range = {
      //     id: `${series.id}-daily-${i}-range`,
      //     seriesId: series.id,
      //     interval: series.interval,
      //     mode: 'daily',
      //     type: 'arearange',
      //     data: chunk.values.map(d => ([d.date.valueOf(), d.min_temp_c, d.max_temp_c])),
      //     visible: true,
      //     showInNavigator: false,
      //     tooltip: {
      //       pointFormat: null
      //     }
      //   }
      //   if (chunk.flag) {
      //     mean.color = 'orangered'
      //     mean.flag = true
      //     range.flag = true
      //   }

      //   return [mean, range]
      // }).flat()

      // chartSeries.push({
      //   id: `${series.id}-daily-tooltip`,
      //   seriesId: series.id,
      //   interval: series.interval,
      //   mode: 'daily',
      //   type: 'line',
      //   data: v.filter(d => !d.flag).map(d => ([d.date.valueOf(), d.mean_temp_c])),
      //   visible: true,
      //   showInNavigator: false,
      //   lineWidth: 0,
      //   tooltip: {
      //     pointFormat: `Series ${series.id}: <b>{point.y}</b> °C`
      //   }
      // })
      // chartSeries.push({
      //   id: `${series.id}-daily-tooltip-flag`,
      //   seriesId: series.id,
      //   interval: series.interval,
      //   flag: true,
      //   mode: 'daily',
      //   type: 'line',
      //   data: v.filter(d => !!d.flag).map(d => ({
      //     x: d.date.valueOf(),
      //     y: d.mean_temp_c,
      //     flag: d.flag
      //   })),
      //   visible: true,
      //   showInNavigator: false,
      //   turboThreshold: 0,
      //   tooltip: {
      //     pointFormat: `Series ${series.id}: <b>{point.y}</b> °C (Flag: <b>{point.flag}</b>)`
      //   },
      //   lineWidth: 0,
      //   color: 'orangered'
      // })
    },

    async init () {
      console.log('init()')
      this.chart.showLoading('Loading data from the server...')
      this.removeUnselectedSeries()

      await Promise.all(this.series.map(async (s) => {
        if (s.interval === 'CONTINUOUS') {
          s.daily = s.daily || {}
          if (!s.daily.values) {
            const values = await this.fetchDailySeries(s)
            s.daily.values = Object.freeze(this.assignFlags(s, values, s.flags, 'daily'))
            s.daily.chunks = Object.freeze(this.getContinuousChunks(s.daily.values, 'date'))
          }
        } else if (s.interval === 'DISCRETE') {
          if (!s.values) {
            const values = await this.fetchDiscreteSeries(s)
            s.values = Object.freeze(this.assignFlags(s, values, s.flags))
            s.chunks = Object.freeze(this.getDiscreteChunks(s.values))
          }
        }

        if (!this.chart.get(`${s.id}-root`)) {
          this.chart.addSeries({
            id: `${s.id}-root`,
            name: `Series ${s.id}`,
            seriesId: s.id,
            data: [],
            visible: true,
            // showInLegend: true,
            showInNavigator: false
          }, false)

          if (s.interval === 'CONTINUOUS') {
            this.chart.addSeries({
              id: `${s.id}-daily-tip`,
              seriesId: s.id,
              mode: 'daily',
              tip: true,
              flag: false,
              type: 'line',
              data: s.daily.values.filter(d => !d.flag).map(d => ({
                x: d.date.valueOf(),
                y: d.mean_temp_c,
                flag: d.flag
              })),
              visible: true,
              showInLegend: false,
              showInNavigator: false,
              turboThreshold: 0,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C`
              },
              lineWidth: 0,
              linkedTo: `${s.id}-root`
            }, false)
            this.chart.addSeries({
              id: `${s.id}-daily-tip-flag`,
              seriesId: s.id,
              mode: 'daily',
              tip: true,
              flag: true,
              type: 'line',
              data: s.daily.values.filter(d => d.flag).map(d => ({
                x: d.date.valueOf(),
                y: d.mean_temp_c,
                flag: d.flag
              })),
              visible: true,
              showInLegend: false,
              showInNavigator: false,
              turboThreshold: 0,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C (<b>{point.flag}</b>)`
              },
              lineWidth: 0,
              color: 'orangered',
              linkedTo: `${s.id}-root`
            }, false)
            this.chart.addSeries({
              id: `${s.id}-raw-tip`,
              seriesId: s.id,
              mode: 'raw',
              tip: true,
              flag: false,
              type: 'line',
              data: [],
              visible: false,
              showInLegend: false,
              showInNavigator: false,
              turboThreshold: 0,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C`
              },
              lineWidth: 0,
              linkedTo: `${s.id}-root`
            }, false)
            this.chart.addSeries({
              id: `${s.id}-raw-tip-flag`,
              seriesId: s.id,
              mode: 'raw',
              tip: true,
              flag: true,
              type: 'line',
              data: [],
              visible: false,
              showInLegend: false,
              showInNavigator: false,
              turboThreshold: 0,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C (<b>{point.flag}</b>)`
              },
              lineWidth: 0,
              color: 'orangered',
              linkedTo: `${s.id}-root`
            }, false)
          } else if (s.interval === 'DISCRETE') {
            this.chart.addSeries({
              id: `${s.id}-discrete-tip`,
              seriesId: s.id,
              mode: 'discrete',
              tip: true,
              flag: false,
              type: 'line',
              data: s.values.filter(d => !d.flag).map(d => ({
                x: d.datetime.valueOf(),
                y: d.temp_c,
                flag: d.flag
              })),
              visible: true,
              showInLegend: false,
              showInNavigator: false,
              turboThreshold: 0,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C`
              },
              lineWidth: 0,
              linkedTo: `${s.id}-root`
            }, false)
            this.chart.addSeries({
              id: `${s.id}-discrete-tip-flag`,
              seriesId: s.id,
              mode: 'discrete',
              tip: true,
              flag: true,
              type: 'line',
              data: s.values.filter(d => d.flag).map(d => ({
                x: d.datetime.valueOf(),
                y: d.temp_c,
                flag: d.flag
              })),
              visible: true,
              showInLegend: false,
              showInNavigator: false,
              turboThreshold: 0,
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C (<b>{point.flag}</b>)`
              },
              lineWidth: 0,
              color: 'orangered',
              linkedTo: `${s.id}-root`
            }, false)
          }
        }
      }))

      this.updateNavigator()
      this.render()

      this.chart.hideLoading()
    },
    async fetchDailySeries (series) {
      console.log(`fetchDailySeries(${series.id})`)
      const values = await this.$http.public
        .get(`/series/${series.id}/daily`)
        .then(d => d.data)
      values.forEach(d => {
        d.date = this.parseDatetime(d.date)
      })
      return values
    },
    async fetchRawSeries (series, start, end) {
      console.log(`fetchRawSeries(${series.id})`)
      const values = await this.$http.public
        .get(`/series/${series.id}/values?start=${start.toISOString()}&end=${end.toISOString()}`)
        .then(d => d.data)
      values.forEach(d => {
        d.datetime = this.parseDatetime(d.datetime)
      })
      return values
    },
    async fetchDiscreteSeries (series) {
      console.log(`fetchDiscreteSeries(${series.id})`)
      const values = await this.$http.public
        .get(`/series/${series.id}/values`)
        .then(d => d.data)
      values.forEach(d => {
        d.datetime = this.parseDatetime(d.datetime)
      })

      // values.forEach(d => {
      //   d.date = this.$luxon.DateTime.fromISO(d.datetime).setZone(series.station_timezone).toFormat('yyyy-MM-dd')
      //   d.min_temp_c = d.temp_c
      //   d.mean_temp_c = d.temp_c
      //   d.max_temp_c = d.temp_c
      // })

      return values
    },
    async render (force) {
      console.log('render()')

      this.renderDiscrete(force)

      const datetimeRange = this.getDatetimeRange()
      console.log('render(): datetimeRange =', datetimeRange)

      if (!datetimeRange) {
        this.renderDaily(force)
      } else {
        const durationDays = datetimeRange[1].diff(datetimeRange[0], 'days').as('days')
        // console.log('afterSetExtremes', durationDays, [datetimeRange[0].toJSDate(), datetimeRange[1].toJSDate()])

        if (durationDays <= 32) {
          await this.renderRaw(force)
        } else {
          this.renderDaily(force)
        }
      }
      this.renderBands()
      this.renderNavigator()

      this.chart.redraw()
    },
    renderDiscrete (force) {
      console.log('renderDiscrete()')

      for (const s of this.series.filter(d => d.interval === 'DISCRETE')) {
        console.log(`renderDiscrete(): series id=${s.id}`)
        const root = this.chart.get(`${s.id}-root`)

        if (force) {
          const existingDiscreteIds = root.linkedSeries
            .filter(d => d.options.mode === 'discrete' && !d.options.tip)
            .map(d => d.options.id)
          for (const id of existingDiscreteIds) {
            console.log(`renderDiscrete(): remove existing discrete chunk (id=${id})`)
            const series = this.chart.get(id)
            if (series) series.remove(false)
          }

          this.chart.get(`${s.id}-discrete-tip`).setData(
            s.values.filter(d => !d.flag).map(d => ({
              x: d.datetime.valueOf(),
              y: d.temp_c,
              flag: d.flag
            })),
            false
          )
          this.chart.get(`${s.id}-discrete-tip-flag`).setData(
            s.values.filter(d => d.flag).map(d => ({
              x: d.datetime.valueOf(),
              y: d.temp_c,
              flag: d.flag
            })),
            false
          )
        }

        if (root.linkedSeries.length === 2 && s.chunks.length > 0) {
          console.log(`renderDiscrete(): add chunks (id=${s.id}-root)`)
          const chunkSeries = s.chunks.map((chunk, i) => {
            return {
              id: `${root.options.id}-${i}-discrete`,
              type: 'line',
              mode: 'discrete',
              seriesId: s.id,
              data: chunk.values.map(d => ([d.datetime.valueOf(), d.temp_c])),
              showInNavigator: false,
              tooltip: {
                pointFormat: null
              },
              lineWidth: 0,
              marker: {
                enabled: true,
                radius: 2,
                symbol: 'circle'
              },
              linkedTo: root.options.id,
              color: chunk.flag ? 'orangered' : 'steelblue',
              flag: chunk.flag
            }
          })
          chunkSeries.forEach(s => this.chart.addSeries(s, false))
        }

        // set visibility
        for (const s of root.linkedSeries) {
          if (!s.options.flag || this.showFlags) {
            // console.log(`renderDaily(): ${s.options.id} true`)
            s.setVisible(root.visible, false)
          } else {
            // console.log(`renderDaily(): ${s.options.id} false`)
            s.setVisible(false, false)
          }
        }
      }
    },
    renderDaily (force) {
      // force=true to remove and replace existing chunks
      console.log('renderDaily()')
      this.mode = 'daily'
      // this.removeRaw()

      for (const s of this.series.filter(d => d.interval === 'CONTINUOUS')) {
        console.log(`renderDaily(): series id=${s.id}`)
        const root = this.chart.get(`${s.id}-root`)

        // remove raw chunks
        const existingRawIds = root.linkedSeries
          .filter(d => d.options.mode === 'raw' && !d.options.tip)
          .map(d => d.options.id)
        for (const id of existingRawIds) {
          console.log(`renderDaily(): remove existing raw chunk (id=${id})`)
          const series = this.chart.get(id)
          if (series) series.remove(false)
        }

        if (force) {
          const existingDailyIds = root.linkedSeries
            .filter(d => d.options.mode === 'daily' && !d.options.tip)
            .map(d => d.options.id)
          for (const id of existingDailyIds) {
            console.log(`renderDaily(): remove existing daily chunk (id=${id})`)
            const series = this.chart.get(id)
            if (series) series.remove(false)
          }

          this.chart.get(`${s.id}-daily-tip`).setData(
            s.daily.values.filter(d => !d.flag).map(d => ({
              x: d.date.valueOf(),
              y: d.mean_temp_c,
              flag: d.flag
            })),
            false
          )
          this.chart.get(`${s.id}-daily-tip-flag`).setData(
            s.daily.values.filter(d => d.flag).map(d => ({
              x: d.date.valueOf(),
              y: d.mean_temp_c,
              flag: d.flag
            })),
            false
          )
        }

        if (root.linkedSeries.length === 4 && s.daily.chunks.length > 0) {
          console.log(`renderDaily(): add chunks (id=${s.id}-root)`)

          const chunkSeries = s.daily.chunks.map((chunk, i) => {
            return [
              {
                id: `${root.options.id}-${i}-mean`,
                type: 'line',
                mode: 'daily',
                seriesId: s.id,
                data: chunk.values.map(d => ([d.date.valueOf(), d.mean_temp_c])),
                visible: true,
                showInNavigator: false,
                tooltip: {
                  pointFormat: null
                },
                linkedTo: root.options.id,
                color: chunk.flag ? 'orangered' : 'steelblue',
                flag: !!chunk.flag,
                marker: {
                  enabled: chunk.values.length === 1,
                  size: 2,
                  symbol: 'circle'
                }
              },
              {
                id: `${root.options.id}-${i}-range`,
                type: 'arearange',
                mode: 'daily',
                seriesId: s.id,
                data: chunk.values.map(d => ([d.date.valueOf(), d.min_temp_c, d.max_temp_c])),
                visible: true,
                showInNavigator: false,
                tooltip: {
                  pointFormat: null
                },
                linkedTo: root.options.id,
                flag: !!chunk.flag
              }
            ]
          }).flat()
          chunkSeries.forEach(s => this.chart.addSeries(s, false))
        }

        // set visibility
        for (const s of root.linkedSeries) {
          if (s.options.mode === 'raw') {
            s.setVisible(false, false)
          } else if (s.options.tip || !s.options.flag || this.showFlags) {
            // console.log(`renderDaily(): ${s.options.id} true`)
            s.setVisible(root.visible, false)
          } else {
            // console.log(`renderDaily(): ${s.options.id} false`)
            s.setVisible(false, false)
          }
        }
      }
    },
    async renderRaw (force) {
      console.log('renderRaw()')
      this.mode = 'raw'
      // this.renderNavigator()
      // this.chart.redraw()

      const datetimeRange = this.getDatetimeRange()
      if (!datetimeRange) return

      const start = datetimeRange[0].toJSDate()
      const end = datetimeRange[1].toJSDate()

      this.chart.showLoading('Loading data from the server...')
      for (const s of this.series.filter(d => d.interval === 'CONTINUOUS')) {
        console.log(`renderRaw(): series id=${s.id}`)
        const root = this.chart.get(`${s.id}-root`)

        s.raw = s.raw || {}
        if (!s.raw.values ||
            s.raw.start.valueOf() !== start.valueOf() ||
            s.raw.end.valueOf() !== end.valueOf()) {
          console.log(`renderRaw(): fetch (id=${s.id}, start=${start.toISOString()}, end=${end.toISOString()})`)
          // console.log(s.raw)
          const values = await this.fetchRawSeries(s, start, end)
          s.raw.values = Object.freeze(this.assignFlags(s, values, s.flags, 'raw'))
          s.raw.chunks = Object.freeze(this.getContinuousChunks(s.raw.values, 'datetime'))
          s.raw.start = start
          s.raw.end = end
        }

        const existingRawIds = root.linkedSeries
          .filter(d => d.options.mode === 'raw' && !d.options.tip)
          .map(d => d.options.id)
        for (const id of existingRawIds) {
          console.log(`renderRaw(): remove existing chunk (id=${id})`)
          const series = this.chart.get(id)
          if (series) series.remove(false)
        }

        this.chart.get(`${s.id}-raw-tip`).setData(
          s.raw.values.filter(d => !d.flag).map(d => ({
            x: d.datetime.valueOf(),
            y: d.temp_c,
            flag: d.flag
          })),
          false
        )
        this.chart.get(`${s.id}-raw-tip-flag`).setData(
          s.raw.values.filter(d => d.flag).map(d => ({
            x: d.datetime.valueOf(),
            y: d.temp_c,
            flag: d.flag
          })),
          false
        )

        const chunkSeries = s.raw.chunks.map((chunk, i) => {
          console.log(`renderRaw(): add new chunk (id=${root.options.id}-${i}-raw)`)
          return {
            id: `${root.options.id}-${i}-raw`,
            type: 'line',
            mode: 'raw',
            seriesId: s.id,
            data: chunk.values.map(d => ([d.datetime.valueOf(), d.temp_c])),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: null
            },
            linkedTo: root.options.id,
            color: chunk.flag ? 'orangered' : 'steelblue',
            flag: !!chunk.flag,
            marker: {
              enabled: chunk.values.length === 1,
              size: 2,
              symbol: 'circle'
            }
          }
        })
        chunkSeries.forEach(s => this.chart.addSeries(s, false))
      }

      // set visibility
      for (const s of this.series.filter(d => d.interval === 'CONTINUOUS')) {
        console.log('raw', s.id)
        console.log(s.raw)
        const root = this.chart.get(`${s.id}-root`)
        for (const s of root.linkedSeries) {
          if (s.options.mode === 'daily') {
            s.setVisible(false, false)
          } else if (!s.options.flag || this.showFlags) {
            // console.log(`renderDaily(): ${s.options.id} true`)
            s.setVisible(root.visible, false)
          } else {
            // console.log(`renderDaily(): ${s.options.id} false`)
            s.setVisible(false, false)
          }
        }
      }
      this.chart.hideLoading()
    },
    renderBands () {
      console.log('renderBands', this.flags, this.flag)
      let bands = []

      if (this.flags) {
        bands = this.flags.map(d => {
          const start = this.parseDatetime(d.start_datetime)
          const end = this.parseDatetime(d.end_datetime)
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
    updateFlags () {
      console.log('updateFlags()')
      this.series.forEach((s) => {
        // console.log(`updateFlags(${s.id})`)
        if (s.interval === 'CONTINUOUS') {
          if (s.daily && s.daily.values) {
            console.log(`updateFlags(${s.id}, daily)`)
            s.daily.values = Object.freeze(this.assignFlags(s, s.daily.values, s.flags, 'daily'))
            s.daily.chunks = Object.freeze(this.getContinuousChunks(s.daily.values, 'date'))
          }
          if (s.raw && s.raw.values) {
            console.log(`updateFlags(${s.id}, raw)`)
            s.raw.values = Object.freeze(this.assignFlags(s, s.raw.values, s.flags, 'raw'))
            s.raw.chunks = Object.freeze(this.getContinuousChunks(s.raw.values, 'datetime'))
          }
        } else if (s.interval === 'DISCRETE') {
          if (s.values) {
            console.log(`updateFlags(${s.id}, discrete)`)
            s.values = Object.freeze(this.assignFlags(s, s.values, s.flags))
            s.chunks = Object.freeze(this.getDiscreteChunks(s.values))
          }
        }
      })
    },
    assignFlags (s, values, flags, mode) {
      if (!flags) return
      console.log(`assignFlags(${s.id}, values=${values.length})`, flags)
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
            const date = d.date.toFormat('yyyy-MM-dd')
            if (date >= startDate && date <= endDate) {
              d.flag.push(label)
            }
          })
        })
      } else {
        flags.forEach(flag => {
          const label = flagLabel(flag)
          values.forEach(d => {
            if (d.datetime >= this.parseDatetime(flag.start_datetime) &&
                d.datetime <= this.parseDatetime(flag.end_datetime)) {
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

    updateNavigator () {
      const continuousValues = this.series
        .filter(d => d.interval === 'CONTINUOUS' && !!d.daily && !!d.daily.values)
        .map(d => this.showFlags ? d.daily.values : d.daily.values.filter(d => !d.flag))
        .flat()
        .map(d => ({
          date: d.date.toFormat('yyyy-MM-dd'),
          value: d.max_temp_c
        }))
      const discreteValues = this.series
        .filter(d => d.interval === 'DISCRETE' && !!d.values)
        .map(d => this.showFlags ? d.values : d.values.filter(d => !d.flag))
        .flat()
        .map(d => ({
          date: d.datetime.toFormat('yyyy-MM-dd'),
          value: d.temp_c
        }))
      const values = [continuousValues, discreteValues].flat()

      const data = Array.from(
        d3.rollup(
          values,
          v => d3.max(v, d => d.value),
          d => d.date
        )
      ).sort((a, b) => d3.ascending(a[0], b[0]))

      console.log(`updateNavigator(): n=${data.length}`)
      console.log(data[0], data[data.length - 1])
      this.navData = data
    },
    renderNavigator () {
      console.log('renderNavigator()')
      this.chart.get('navigator').setData(this.navData.map(d => [this.parseDatetime(d[0]).valueOf(), d[1]]), false)
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
    },

    updateSeriesDebug () {
      this.seriesDebug = this.chart.series.map(d => ({
        id: d.options.id,
        visible: d.visible,
        mode: d.options.mode,
        flag: d.options.flag,
        dataLength: d.options.data.length
      }))
    }
  }
}
</script>

<style>

</style>
