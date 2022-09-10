<template>
  <div class="py-4">
    <Loading v-if="loading" class="pb-8"></Loading>
    <Alert v-else-if="values.length === 0" type="info" title="No Timeseries Available" class="mb-0 mx-4">
      This station does not have any timeseries data.
    </Alert>
    <div v-else>
      <div class="mx-4">
        <highcharts :options="chart"></highcharts>
        <div class="text--secondary caption">
          <v-icon x-small>mdi-information</v-icon> Click+drag to zoom in. Shift+click to slide.
        </div>
        <div class="text--secondary caption mt-2">
          Click <code>Explore Station Data</code> button above to view raw data.
        </div>
      </div>

      <v-divider class="my-4"></v-divider>

      <div class="text-right mx-4">
        <DownloadButton @click="download" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StationDetailSeries',
  props: ['station'],
  data () {
    return {
      loading: true,
      values: [],
      chart: {
        chart: {
          zoomType: 'x',
          height: 200,
          marginLeft: 50,
          spacingLeft: 50,
          panning: true,
          panKey: 'shift',
          resetZoomButton: {
            position: {
              x: 0,
              y: 0
            }
          }
        },
        plotOptions: {
          series: {
            gapSize: 5
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
          enabled: false
        },
        tooltip: {
          xDateFormat: '%b %d, %Y',
          shared: true
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: 'degC'
          },
          tickAmount: 5,
          allowDecimals: false
        },
        series: []
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
      const response = await this.$http.public.get(`/stations/${this.station.id}/series/daily`)
      const values = response.data
      this.values = Object.freeze(values)
      this.chart.series = [
        {
          name: 'mean',
          type: 'line',
          data: values.map(v => {
            return [
              (new Date(v.date)).valueOf(),
              v.mean
            ]
          })
        },
        {
          name: 'range',
          type: 'arearange',
          data: values.map(v => {
            return [
              (new Date(v.date)).valueOf(),
              v.min,
              v.max
            ]
          })
        }
      ]
      this.loading = false
    },
    download () {
      if (this.loading || this.values.length === 0) return

      this.$download.csv(this.values, `AKTEMP-${this.station.organization_code}-${this.station.code}-daily.csv`)
    }
  }
}
</script>
