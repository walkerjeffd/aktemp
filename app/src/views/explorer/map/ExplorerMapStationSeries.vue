i<template>
  <div class="py-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert v-else-if="error" type="error" title="Server Error" class="mb-0 mx-4">
      Failed to get timeseries from the server.<br><br>
      <strong>{{ error }}</strong>
    </Alert>
    <Alert v-else-if="values.length === 0" type="info" title="No Timeseries Available" class="mb-0 mx-4">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <div class="mx-4">
        <highcharts :options="chart"></highcharts>

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
          This chart shows the daily mean and range over all available timeseries at this station. Click <code>Explore Station Data</code> below to view the individual timeseries, which may vary by depth, or to drill down into the raw data. Click <code>Download</code> to download a file containing the daily values shown above.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { assignDailyFlags } from '@/lib/utils'

export default {
  name: 'ExplorerMapStationSeries',
  props: ['station'],
  data () {
    return {
      loading: true,
      error: null,
      about: false,
      values: [],
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
        const values = await this.$http.public.get(`/stations/${this.station.id}/series/daily`)
          .then(d => d.data)
        const flags = await this.$http.public.get(`/stations/${this.station.id}/series/flags`)
          .then(d => d.data)

        this.values = Object.freeze(values)
        this.flags = flags

        const { values: unflaggedValues, flags: flaggedValues } = assignDailyFlags(values, flags)

        this.chart.series = [
          {
            name: 'mean',
            type: 'line',
            data: unflaggedValues.map(v => {
              return [
                (new Date(v.date)).valueOf(),
                v.mean_temp_c
              ]
            }),
            showInLegend: false
          },
          {
            name: 'range',
            type: 'arearange',
            data: unflaggedValues.map(v => {
              return [
                (new Date(v.date)).valueOf(),
                v.min_temp_c,
                v.max_temp_c
              ]
            }),
            showInLegend: false
          },
          {
            id: 'flag',
            name: 'Flagged',
            type: 'line',
            data: [],
            color: 'orangered',
            showInLegend: flaggedValues.length > 0
          },
          ...(flaggedValues.map((flag, i) => [
            {
              id: `flag-${i}-mean`,
              marker: {
                enabled: flag.values.length === 1,
                radius: 2,
                symbol: 'circle'
              },
              data: flag.values.map(d => [(new Date(d.date)).valueOf(), d.mean_temp_c]),
              color: 'orangered',
              showInLegend: false,
              linkedTo: 'flag'
            },
            {
              id: `flag-${i}-range`,
              type: 'arearange',
              data: flag.values.map(d => [(new Date(d.date)).valueOf(), d.min_temp_c, d.max_temp_c]),
              tooltip: {
                pointFormat: `Range: </b><b>{point.low}</b> - <b>{point.high}</b> °C<br/>Flag: ${flag.label}`,
                valueDecimals: 1
              },
              linkedTo: ':previous',
              showInLegend: false
            }
          ]).flat())
        ]
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    async download () {
      if (this.loading || this.values.length === 0) return

      const series = await this.$http.public.get(`/stations/${this.station.id}/series`)
        .then(d => d.data)

      const filename = `AKTEMP-${this.station.organization_code}-${this.station.code}-daily.csv`
      this.$download.stationDailyValues(filename, this.station, series, this.values)
    }
  }
}
</script>
