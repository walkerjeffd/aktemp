<template>
  <v-card elevation="4" class="pb-4">
    <v-toolbar flat dense color="grey lighten-3">
      <v-toolbar-title>
        <span class="text-h6">Selected Timeseries</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon small class="mr-0" @click="$router.push({ name: 'manageSeries'})"><v-icon small>mdi-close</v-icon></v-btn>
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
  watch: {
    '$route.params.seriesId' () {
      this.fetch()
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
        this.$vuetify.goTo(document.body.scrollHeight)
      }
    }
  }
}
</script>
