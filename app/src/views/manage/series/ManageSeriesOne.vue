<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4" class="pb-4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Manage Timeseries</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageFile', params: { fileId: series.file_id} })" v-if="$route.params.from === 'file'">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to File</span><span v-else>Back</span>
              </v-btn>
              <v-btn text @click="$router.push({ name: 'manageSeries' })" v-else>
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Series</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <Loading v-if="loading"></Loading>
            <Alert type="error" title="Failed to Load Series" class="mx-8 mt-8" v-else-if="error">{{ error }}</Alert>
            <v-container grid-list-xs v-else-if="series">
              <v-row>
                <v-col cols="12" lg="4" xl="3">
                  <ManageSeriesInfo :series="series"></ManageSeriesInfo>
                </v-col>
                <v-col cols="12" lg="8" xl="9">
                  <ManageSeriesChart :series="series"></ManageSeriesChart>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import ManageSeriesInfo from '@/views/manage/series/ManageSeriesInfo'
import ManageSeriesChart from '@/views/manage/series/ManageSeriesChart'

export default {
  name: 'ManageSeriesOne',
  components: {
    ManageSeriesInfo,
    ManageSeriesChart
  },
  data () {
    return {
      loading: true,
      error: null,
      series: null
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null
      try {
        const response = await this.$http.restricted(`/series/${this.$route.params.seriesId}`)
        this.series = response.data
      } catch (err) {
        this.err = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    selectSeries (series) {
      if (this.selectedSeries === series) {
        this.selectedSeries = null
      } else {
        this.selectedSeries = series
      }
    }
  }
}
</script>
