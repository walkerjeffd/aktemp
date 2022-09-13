<template>
  <div style="width:100%">
    <Loading v-if="loading" :style="{ 'height': chart.chart.height - 16 + 'px' }"></Loading>
    <Alert v-else-if="error" type="error" title="Failed to Get Timeseries Data" class="mb-0">{{ error }}</Alert>
    <div v-else>
      <highcharts :constructor-type="'stockChart'" :options="chart" ref="chart"></highcharts>
      <div class="text--secondary overline ml-12">
        Mode: <strong>{{ mode === 'daily' ? 'Daily Mean and Range' : 'Raw Instantaneous' }}</strong>
      </div>
      <div class="text--secondary caption ml-12"><v-icon x-small>mdi-information</v-icon> Zoom in to see raw instantaneous data (selected period must be &lt; 30 days long). Click "Flagged" in the legend to hide/show flagged values.</div>
    </div>
  </div>
</template>

<script>
function setVisibleNavigatorFlag (chart, visible) {
  if (!chart) return
  chart.series.forEach(d => {
    if (d.options.id && d.options.id.startsWith('navigator-flag')) {
      d.setVisible(visible)
    }
  })
}

export default {
  name: 'SeriesChart',
  props: ['series'],
  data () {
    return {
      loading: true,
      error: null,
      values: [],
      flags: [],
      mode: 'daily',
      chart: {
        chart: {
          height: 500,
          marginLeft: 50,
          spacingLeft: 50,
          zoomType: 'x',
          animation: false
        },
        plotOptions: {
          series: {
            gapSize: 5,
            showInLegend: false,
            animation: false
          },
          arearange: {
            lineWidth: 0,
            linkedTo: ':previous',
            color: 'black',
            fillOpacity: 0.25,
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
              valueDecimals: 1,
              xDateFormat: '%Y'
            },
            states: {
              hover: {
                lineWidthPlus: 0
              }
            }
          },
          line: {
            marker: {
              enabled: false
            },
            zIndex: 1,
            lineWidth: 1,
            tooltip: {
              pointFormat: 'Daily Mean: <b>{point.y}</b> °C<br/>',
              valueDecimals: 1
            },
            states: {
              hover: {
                lineWidthPlus: 0
              }
            },
            dataGrouping: {
              enabled: false
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
        legend: {
          enabled: true,
          align: 'right'
        },
        series: [],
        tooltip: {
          xDateFormat: '%b %e, %Y',
          split: false,
          shared: true
        },
        navigator: {
          adaptToUpdatedData: false,
          series: []
        },
        scrollbar: {
          liveRedraw: false
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
        credits: {
          enabled: false
        }
      }
    }
  },
  watch: {
    series () {
      this.fetch()
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async afterSetExtremes (e) {
      const chart = e.target.chart
      if (!chart) return

      chart.series.forEach(d => {
        if (d.options.id && d.options.id.startsWith('raw-flag-')) {
          d.remove(false)
        }
      })

      let flagVisible
      if (this.mode === 'daily') {
        flagVisible = chart.get('daily-flag').visible
      } else if (this.mode === 'raw') {
        flagVisible = chart.get('raw-flag').visible
      }

      const start = this.$date(e.min)
      const end = this.$date(e.max)
      const durationDays = end.diff(start, 'day', true)

      if (durationDays <= 30) {
        chart.showLoading('Loading data from server...')

        const values = await this.$http.restricted.get(`/series/${this.series.id}/values?start=${start.toISOString()}&end=${end.toISOString()}`)
          .then(d => d.data)

        this.flags.forEach((flag, i) => {
          if (values.length === 0) {
            return
          } else if (new Date(flag.end_datetime) < new Date(values[0].datetime)) {
            return
          } else if (new Date(flag.start_datetime) > new Date(values[values.length - 1].datetime)) {
            return
          }
          const label = flag.flag_type_id === 'OTHER' ? flag.flag_type_other : flag.flag_type_id

          const startIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.start_datetime))
          const endIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.end_datetime))

          let flagValues = []
          if (startIndex < 0 && endIndex >= 0) {
            flagValues = values.splice(0, values.length - endIndex + 1)
          } else if (startIndex >= 0 && endIndex < 0) {
            flagValues = values.splice(startIndex, values.length - startIndex)
          } else {
            flagValues = values.splice(startIndex, endIndex - startIndex + 1)
              .map(d => ({
                ...d,
                flag: label
              }))
          }

          const series = {
            id: `raw-flag-${i + 1}`,
            marker: {
              enabled: flagValues.length === 1,
              radius: 3,
              symbol: 'circle'
            },
            tooltip: {
              pointFormat: `Temperature: </b><b>{point.y}</b> °C<br/>Flag: ${label}`
            },
            data: flagValues.map(d => [(new Date(d.datetime)).valueOf(), d.value]),
            color: 'orangered',
            showInLegend: false,
            linkedTo: 'raw-flag',
            zIndex: 10
          }
          chart.addSeries(series)
        })

        chart.get('daily-mean').setVisible(false, false)
        chart.get('daily-range').setVisible(false, false)
        chart.get('daily-flag').setVisible(false, false)
        chart.get('daily-flag').update({ showInLegend: false }, false)
        chart.get('raw-value').setData(values.map(d => [(new Date(d.datetime)).valueOf(), d.value]), true, false, false)
        chart.get('raw-value').setVisible(true, false)
        chart.get('raw-flag').setVisible(flagVisible, false)
        chart.get('raw-flag').update({ showInLegend: true }, false)
        setVisibleNavigatorFlag(chart, flagVisible)
        chart.update({
          tooltip: {
            xDateFormat: '%b %e, %Y %l:%M %p'
          }
        }, false)
        chart.hideLoading()
        chart.redraw()
        this.mode = 'raw'
      } else {
        chart.get('daily-mean').setVisible(true, false)
        chart.get('daily-range').setVisible(true, false)
        chart.get('daily-flag').setVisible(flagVisible, false)
        chart.get('daily-flag').update({ showInLegend: true }, false)
        chart.get('raw-value').setData([], false)
        chart.get('raw-value').setVisible(false, false)
        chart.get('raw-flag').setVisible(false, false)
        chart.get('raw-flag').update({ showInLegend: false })
        setVisibleNavigatorFlag(chart, flagVisible)
        chart.update({
          tooltip: {
            xDateFormat: '%b %e, %Y'
          }
        }, false)
        chart.redraw()
        this.mode = 'daily'
      }
    },
    async fetch () {
      this.loading = true
      this.error = null

      try {
        const values = await this.$http.restricted.get(`/series/${this.series.id}/daily`)
          .then(d => d.data)
        const flags = await this.$http.restricted.get(`/series/${this.series.id}/flags`)
          .then(d => d.data)

        this.values = Object.freeze(values)
        this.flags = Object.freeze(flags)

        this.render()
      } catch (err) {
        this.err = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    render () {
      const values = this.values.slice()
      const flaggedSeries = this.flags.map((flag, i) => {
        const startIndex = values.findIndex(d => d.date >= flag.start_date)
        const endIndex = values.findIndex(d => d.date >= flag.end_date)
        const label = flag.flag_type_id === 'OTHER' ? flag.flag_type_other : flag.flag_type_id

        let flagValues = []
        if (startIndex >= 0 && endIndex < 0) {
          // flag ends after last value
          flagValues = values.splice(startIndex, values.length - startIndex)
        } else if (startIndex === 0 && endIndex >= 0) {
          // flag begins on or before first value
          flagValues = values.splice(startIndex, endIndex)
        } else {
          flagValues = values.splice(startIndex, endIndex - startIndex + 1)
            .map(d => ({
              ...d,
              flag: label
            }))
        }
        console.log(i, startIndex, endIndex, flag, flagValues)

        return [
          {
            id: `daily-flag-mean-${i}`,
            marker: {
              enabled: flagValues.length === 1,
              radius: 3,
              symbol: 'circle'
            },
            data: flagValues.map(d => [(new Date(d.date)).valueOf(), d.mean]),
            color: 'orangered',
            showInLegend: false,
            linkedTo: 'daily-flag',
            showInNavigator: false,
            zIndex: flagValues.length === 1 ? 2 : 1
          },
          {
            id: `daily-flag-range-${i}`,
            type: 'arearange',
            data: flagValues.map(d => [(new Date(d.date)).valueOf(), d.min, d.max]),
            tooltip: {
              pointFormat: `Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C<br/>Flag: ${label}`,
              valueDecimals: 1
            },
            linkedTo: ':previous',
            showInNavigator: false
          }
        ]
      })

      this.chart.series = [
        {
          id: 'daily-mean',
          type: 'line',
          data: values.map(d => [(new Date(d.date)).valueOf(), d.mean]),
          visible: true,
          showInNavigator: false
        },
        {
          id: 'daily-range',
          type: 'arearange',
          data: values.map(d => [(new Date(d.date)).valueOf(), d.min, d.max]),
          visible: true
        },
        {
          id: 'daily-flag',
          name: 'Flagged',
          data: [],
          color: 'orangered',
          showInLegend: true,
          showInNavigator: false,
          events: {
            hide: function (e) {
              console.log('hide daily-flag')
              const chart = e.target.chart
              setVisibleNavigatorFlag(chart, false)
            },
            show: function (e) {
              console.log('show daily-flag')
              const chart = e.target.chart
              setVisibleNavigatorFlag(chart, true)
            }
          }
        },
        {
          id: 'raw-value',
          type: 'line',
          data: [],
          visible: false,
          showInNavigator: false,
          tooltip: {
            pointFormat: 'Temperature: <b>{point.y}</b> °C<br/>',
            valueDecimals: 1
          }
        },
        {
          id: 'raw-flag',
          name: 'Flagged',
          type: 'line',
          data: [],
          visible: false,
          showInNavigator: false,
          color: 'orangered',
          events: {
            hide: function (e) {
              console.log('hide raw-flag')
              const chart = e.target.chart
              setVisibleNavigatorFlag(chart, false)
            },
            show: function (e) {
              console.log('show raw-flag')
              const chart = e.target.chart
              setVisibleNavigatorFlag(chart, true)
            }
          }
        },
        ...flaggedSeries.flat()
      ]

      this.chart.navigator.series = [
        {
          id: 'navigator-mean',
          type: 'areaspline',
          visible: true,
          data: values.map(d => [(new Date(d.date)).valueOf(), d.mean])
        },
        ...(flaggedSeries.map((d, i) => {
          return {
            id: `navigator-flag-${i}`,
            type: 'areaspline',
            data: d[0].data,
            color: 'orangered',
            linkedTo: 'navigator-flag'
          }
        }))
      ]
    }
  }
}
</script>

<style>

</style>
