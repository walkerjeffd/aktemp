<template>
  <div style="width:100%">
    <Loading v-if="loading" :style="{ 'height': settings.height - 16 + 'px' }"></Loading>
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

import { flagLabel, assignDailyFlags, assignRawFlags } from '@/lib/utils'

export default {
  name: 'SeriesChart',
  props: ['series', 'selected'],
  data () {
    return {
      loading: false,
      error: null,
      mode: 'daily',
      showFlags: true,
      dailySeries: [],
      rawSeries: [],
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
              }
            }
          },
          line: {
            zIndex: 1,
            lineWidth: 1,
            marker: {
              enabled: false
            },
            states: {
              hover: {
                lineWidthPlus: 0
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
              pointFormat: null
            },
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
            data: []
            // dataGrouping: {
            //   enabled: false
            // }
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
              hide: () => {
                console.log('flag-daily:hide')
                this.showFlags = false
              },
              show: () => {
                console.log('flag-daily:show')
                this.showFlags = true
              }
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
              hide: () => {
                console.log('flag-raw:hide')
                this.showFlags = false
              },
              show: () => {
                console.log('flag-raw:show')
                this.showFlags = true
              }
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
    selectedIds () {
      return this.selected.map(d => d.id)
    },
    selectedDailySeries () {
      return this.dailySeries.filter(d => this.selectedIds.includes(d.id))
    }
  },
  watch: {
    series () {
      // console.log('watch:series')
      this.fetchDaily()
    },
    dailySeries () {
      // console.log('watch:dailySeries')
      this.renderDaily()
    },
    rawSeries () {
      // console.log('watch:rawSeries')
      this.renderRaw()
    },
    selected () {
      // console.log('watch:selected')
      this.renderDaily()
      // this.afterSetExtremes()
    },
    showFlags () {
      // console.log('watch:showFlags')
      this.updateNavigator()
    },
    mode (value, old) {
      // console.log('watch:mode', value, old)
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
      const start = this.$date(extremes.min)
      const end = this.$date(extremes.max)
      const durationDays = end.diff(start, 'day', true)
      // console.log('afterSetExtremes', start.toISOString(), end.toISOString(), durationDays)

      // remove existing raw series
      this.chart.series.map(d => d.options.id)
        .filter(d => d.startsWith('raw-'))
        .forEach(id => this.chart.get(id).remove(false))

      if (durationDays <= 31) {
        await this.fetchRaw(start.toDate(), end.toDate())
        this.mode = 'raw'
      } else if (this.mode === 'raw') {
        this.mode = 'daily'
      }
    },
    async fetchDaily () {
      // console.log('fetchDaily')
      this.loading = true
      this.error = null

      try {
        this.dailySeries = await Promise.all(
          this.series.map(async (d) => {
            const values = await this.$http.public
              .get(`/series/${d.id}/daily`)
              .then(d => d.data)
            const flags = await this.$http.public
              .get(`/series/${d.id}/flags`)
              .then(d => d.data)
            const { values: unflaggedValues, flags: dailyFlags } = assignDailyFlags(values, flags)
            return {
              id: d.id,
              flags: dailyFlags,
              values: {
                all: values,
                unflagged: unflaggedValues
              }
            }
          })
        )
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    renderDaily () {
      // console.log('renderDaily')
      if (!this.chart) return

      // remove existing series
      this.chart.series.map(d => d.options.id)
        .filter(d => d.startsWith('daily-'))
        .forEach(id => this.chart.get(id).remove())

      // generate chart series for selected
      this.selectedDailySeries.map(s => {
        // console.log(`renderDaily | series:${s.id}`)
        const flagSeries = s.flags.map((flag) => {
          // console.log(`renderDaily | series:${s.id}, flag:${flag.id}`, flag)
          const label = flagLabel(flag)
          return [
            {
              id: `daily-mean-${s.id}-flag-${flag.id}`,
              name: `series-${s.id}-flag`,
              seriesId: s.id,
              flag: true,
              type: 'line',
              data: flag.values.map(d => [(new Date(d.date)).valueOf(), d.mean]),
              tooltip: {
                pointFormat: `Series ${s.id}: <b>{point.y}</b> °C (Flag: <b>${label}</b>)`
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
              id: `daily-range-${s.id}-flag-${flag.id}`,
              name: `series-${s.id}-flag`,
              seriesId: s.id,
              flag: true,
              type: 'arearange',
              data: flag.values.map(d => [(new Date(d.date)).valueOf(), d.min, d.max]),
              linkedTo: 'flag-daily'
            }
          ]
        }).flat()
        return [
          {
            id: `daily-mean-${s.id}`,
            seriesId: s.id,
            type: 'line',
            data: s.values.unflagged.map(d => [(new Date(d.date)).valueOf(), d.mean]),
            visible: true,
            showInNavigator: false,
            tooltip: {
              pointFormat: `Series ${s.id}: <b>{point.y}</b> °C`
            }
          },
          {
            id: `daily-range-${s.id}`,
            name: `series-${s.id}`,
            seriesId: s.id,
            type: 'arearange',
            data: s.values.unflagged.map(d => [(new Date(d.date)).valueOf(), d.min, d.max]),
            visible: true,
            linkedTo: ':previous'
          },
          ...flagSeries
        ]
      }).flat()
        .forEach(d => this.chart.addSeries(d))

      const extremes = this.chart.xAxis[0].getExtremes()
      if (isFinite(extremes.dataMin) && isFinite(extremes.dataMax)) {
        this.chart.xAxis[0].setExtremes(extremes.dataMin, extremes.dataMax)
      }

      this.updateNavigator()

      this.loading = false
    },
    async fetchRaw (start, end) {
      // console.log('fetchRaw', start.toISOString(), end.toISOString())
      if (!this.chart) return

      this.chart.showLoading('Loading data from server...')
      this.rawSeries = await Promise.all(
        this.selectedDailySeries.map(async (d) => {
          const values = await this.$http.public
            .get(`/series/${d.id}/values?start=${start.toISOString()}&end=${end.toISOString()}`)
            .then(d => d.data)
          const { values: unflaggedValues, flags } = assignRawFlags(values, d.flags)
          return {
            id: d.id,
            flags,
            values: {
              all: values,
              unflagged: unflaggedValues
            }
          }
        })
      )
      this.chart.hideLoading()
    },
    renderRaw () {
      // console.log('renderRaw')

      if (!this.chart) return

      // generate chart series for selected
      const chartSeries = this.rawSeries.map(s => {
        const flagSeries = s.flags.map(flag => {
          const label = flagLabel(flag)
          return {
            id: `raw-${s.id}-flag-${flag.id}`,
            name: `series-${s.id}-flag`,
            seriesId: s.id,
            flag: true,
            type: 'line',
            data: flag.values.map(d => [(new Date(d.datetime)).valueOf(), d.value]),
            tooltip: {
              pointFormat: `Series ${s.id}: <b>{point.y}</b> °C<br/>Flag: ${label}`
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

        return [
          {
            id: `raw-${s.id}`,
            seriesId: s.id,
            type: 'line',
            data: s.values.unflagged.map(d => [(new Date(d.datetime)).valueOf(), d.value]),
            tooltip: {
              pointFormat: `Series ${s.id}: <b>{point.y}</b> °C`
            }
          },
          ...flagSeries
        ]
      }).flat()

      chartSeries.forEach(d => this.chart.addSeries(d, true))

      this.chart.redraw()
      this.updateNavigator()

      this.loading = false
    },
    getNavigatorData () {
      // console.log('getNavigatorData')
      return Array.from(
        d3.rollup(
          this.selectedDailySeries
            .map(d => this.showFlags ? d.values.all : d.values.unflagged).flat(),
          v => ({
            mean: d3.mean(v, d => d.mean),
            min: d3.min(v, d => d.min),
            max: d3.max(v, d => d.max)
          }),
          d => d.date
        )
      ).sort((a, b) => d3.ascending(a[0], b[0]))
    },
    updateNavigator () {
      // console.log('updateNavigator')
      if (!this.chart) return
      const navigatorData = this.getNavigatorData()
      this.chart.get('navigator')
        .setData(navigatorData.map(d => [(new Date(d[0])).valueOf(), d[1].max]))
    }
  }
}
</script>

<style>

</style>
