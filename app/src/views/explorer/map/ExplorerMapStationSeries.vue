i<template>
  <div class="py-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert v-else-if="error" type="error" title="Server Error" class="mb-0 mx-4">
      Failed to get timeseries from the server.<br><br>
      <strong>{{ error }}</strong>
    </Alert>
    <!-- <Alert v-else-if="values.length === 0" type="info" title="No Timeseries Available" class="mb-0 mx-4">
      This station does not have any timeseries data.
    </Alert> -->
    <div v-else>
      <div class="mx-4">
        <highcharts :options="chart" ref="chart"></highcharts>

        <div class="text--secondary caption ml-2">
          <v-icon x-small>mdi-information</v-icon> Click+drag to zoom in, shift+click to slide. Click <code>Flagged</code> in legend to hide/show flagged data (if any).
        </div>

        <div class="text-right d-flex align-end mt-4">
          <v-btn x-small text @click="about = !about">
            About This Chart
            <v-icon v-if="about" x-small right>mdi-chevron-up-circle-outline</v-icon>
            <v-icon v-else x-small right>mdi-chevron-down-circle-outline</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <DownloadButton @click="download" text="Download" small />
        </div>

        <div class="text--secondary caption ml-2 mt-4" v-if="about">
          This chart shows the daily mean and range over all continuous timeseries at this station. Discrete timesries are shown as individual points. Click <code>Explore Station Data</code> below to view the individual timeseries, which may vary by depth, or to drill down into the raw data. Click <code>Download</code> to download a file containing the daily and discrete values shown above.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ascending } from 'd3'
import { assignFlags } from 'aktemp-utils/flags'
import { writeStationSeriesFile } from 'aktemp-utils/downloads'
import { getDiscreteChunks, getContinuousChunks } from '@/lib/utils'

export default {
  name: 'ExplorerMapStationSeries',
  props: ['station'],
  data () {
    return {
      loading: true,
      error: null,
      about: false,
      discrete: {
        values: [],
        chunks: []
      },
      daily: {
        values: [],
        chunks: []
      },
      chart: {
        chart: {
          zoomType: 'x',
          height: 250,
          // marginLeft: 60,
          // spacingLeft: 50,
          panning: true,
          panKey: 'shift',
          resetZoomButton: {
            position: {
              x: 0,
              y: 0
            }
          },
          animation: false
        },
        plotOptions: {
          series: {
            gapSize: 2,
            animation: false,
            showInLegend: false,
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
              pointFormat: 'Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C',
              valueDecimals: 1
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
            }
          }
        },
        title: {
          text: 'Daily Mean (Range) Temperature',
          align: 'left',
          style: {
            fontSize: '0.85rem'
          }
        },
        legend: {
          enabled: true,
          align: 'right'
        },
        tooltip: {
          xDateFormat: '%b %e, %Y',
          shared: true
        },
        xAxis: {
          type: 'datetime',
          ordinal: false
        },
        yAxis: {
          title: {
            text: 'degC'
          },
          tickAmount: 5,
          allowDecimals: false
        },
        series: [],
        credits: {
          enabled: false
        }
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
      try {
        const discreteSeries = await this.$http.public.get(`/stations/${this.station.id}/series/discrete`)
          .then(d => d.data)
        console.log(discreteSeries)

        const discreteValues = discreteSeries
          .map(s => assignFlags(s.values, s.flags))
          .flat()
          .sort((a, b) => ascending(a.datetime, b.datetime))
        this.discrete.values = Object.freeze(discreteValues)
        this.discrete.chunks = Object.freeze(getDiscreteChunks(discreteValues))

        const daily = await this.$http.public.get(`/stations/${this.station.id}/series/daily`)
          .then(d => d.data)
        daily.forEach(d => {
          d.date = this.$luxon.DateTime.fromISO(d.date, { zone: this.station.timezone }).toJSDate()
        })
        const flags = await this.$http.public.get(`/stations/${this.station.id}/series/flags`)
          .then(d => d.data)

        this.daily.values = Object.freeze(assignFlags(daily, flags, this.station.timezone, true))
        this.daily.chunks = Object.freeze(getContinuousChunks(this.daily.values, 'date'))

        this.render()
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    render () {
      const dailySeries = this.daily.chunks.map((chunk, i) => {
        return [
          {
            id: `daily-${i}-mean`,
            type: 'line',
            data: chunk.values.map(d => ([d.date.valueOf(), d.mean_temp_c])),
            visible: true,
            tooltip: {
              pointFormat: null
            },
            linkedTo: chunk.flag ? 'flagged' : undefined,
            color: chunk.flag ? 'orangered' : 'steelblue',
            flag: !!chunk.flag,
            marker: {
              enabled: chunk.values.length === 1,
              radius: 2,
              symbol: 'circle'
            }
          },
          {
            id: `daily-${i}-range`,
            type: 'arearange',
            data: chunk.values.map(d => ([d.date.valueOf(), d.min_temp_c, d.max_temp_c])),
            visible: true,
            tooltip: {
              pointFormat: null
            },
            linkedTo: chunk.flag ? 'flagged' : undefined,
            flag: !!chunk.flag
          }
        ]
      }).flat()

      const discreteSeries = this.discrete.chunks.map((chunk, i) => {
        return {
          id: `discrete-${i}`,
          type: 'line',
          data: chunk.values.map(d => ([new Date(d.datetime).valueOf(), d.temp_c])),
          tooltip: {
            pointFormat: null
          },
          lineWidth: 0,
          marker: {
            enabled: true,
            radius: 2,
            symbol: 'circle'
          },
          linkedTo: chunk.flag ? 'flagged' : undefined,
          color: chunk.flag ? 'orangered' : 'steelblue',
          flag: chunk.flag
        }
      })
      this.chart.series = [
        {
          id: 'flagged',
          name: 'Flagged',
          type: 'line',
          data: [],
          visible: true,
          showInLegend: true,
          color: 'orangered'
        },
        {
          id: 'daily-tip',
          tip: true,
          flag: false,
          type: 'line',
          data: this.daily.values
            .filter(d => !d.flag)
            .map(d => ({
              x: d.date.valueOf(),
              y: d.mean_temp_c,
              flag: d.flag
            })),
          visible: true,
          showInLegend: false,
          turboThreshold: 0,
          tooltip: {
            pointFormat: 'Daily Mean: <b>{point.y}</b> °C'
          },
          lineWidth: 0,
          states: {
            hover: {
              enabled: true
            }
          },
          marker: {
            radius: 2,
            symbol: 'circle'
          }
        },
        {
          id: 'daily-tip-flag',
          tip: true,
          flag: true,
          type: 'line',
          data: this.daily.values
            .filter(d => d.flag)
            .map(d => ({
              x: d.date.valueOf(),
              y: d.mean_temp_c,
              flag: d.flag
            })),
          visible: true,
          showInLegend: false,
          turboThreshold: 0,
          tooltip: {
            pointFormat: 'Daily Mean: <b>{point.y}</b> °C<br />Flag: <b>{point.flag}</b>'
          },
          lineWidth: 0,
          color: 'orangered',
          linkedTo: 'flagged',
          states: {
            hover: {
              enabled: true
            }
          },
          marker: {
            radius: 2,
            symbol: 'circle'
          }
        },
        {
          id: 'discrete-tip',
          tip: true,
          flag: false,
          type: 'line',
          data: this.discrete.values
            .filter(d => !d.flag)
            .map(d => ({
              x: new Date(d.datetime).valueOf(),
              y: d.temp_c,
              flag: d.flag
            })),
          visible: true,
          showInLegend: false,
          turboThreshold: 0,
          tooltip: {
            pointFormat: 'Discrete: <b>{point.y}</b> °C'
          },
          lineWidth: 0,
          states: {
            hover: {
              enabled: true
            }
          },
          marker: {
            radius: 2,
            symbol: 'circle'
          }
        },
        {
          id: 'discrete-tip-flag',
          tip: true,
          flag: true,
          type: 'line',
          data: this.discrete.values
            .filter(d => d.flag)
            .map(d => ({
              x: new Date(d.datetime).valueOf(),
              y: d.temp_c,
              flag: d.flag
            })),
          visible: true,
          showInLegend: false,
          turboThreshold: 0,
          tooltip: {
            pointFormat: 'Discrete: <b>{point.y}</b> °C<br />Flag: <b>{point.flag}</b>'
          },
          lineWidth: 0,
          color: 'orangered',
          linkedTo: 'flagged',
          states: {
            hover: {
              enabled: true
            }
          },
          marker: {
            radius: 2,
            symbol: 'circle'
          }
        },
        ...dailySeries,
        ...discreteSeries
      ]
    },
    async download () {
      if (this.loading) return

      const series = await this.$http.public.get(`/stations/${this.station.id}/series`)
        .then(d => d.data)

      const filename = `AKTEMP-${this.station.provider_code}-${this.station.code}-timeseries.csv`
      const body = writeStationSeriesFile(this.station, series, this.daily.values, this.discrete.values)
      this.$download(body, filename)
    }
  }
}
</script>
