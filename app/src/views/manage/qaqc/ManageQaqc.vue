<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-row>
    <v-col cols="12">
      <Alert type="error" title="Failed to Load Series" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="filteredSeries"
        :loading="status.loading"
        :options="{ itemsPerPage: 10 }"
        @click:row="select"
        single-select
        loading-text="Loading... Please wait"
        class="row-cursor-pointer elevation-2"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title class="text-h5">Timeseries</v-toolbar-title>
            <v-spacer></v-spacer>
            <RefreshButton @click="fetch"></RefreshButton>
          </v-toolbar>
          <!-- <div class="body-2 text--secondary mx-4 mb-2">
            <v-icon small>mdi-information-outline</v-icon>
            Click on a row to review the timeseries
          </div> -->
          <v-toolbar flat dense>
            <v-row justify="space-between">
              <v-col cols="12" md="3">
                <v-switch
                  v-model="showReviewed"
                  label="Show Reviewed"
                ></v-switch>
              </v-col>
            </v-row>
          </v-toolbar>
          <v-divider></v-divider>
        </template>
        <template v-slot:item.station_code="{ item }">
          {{ item.station_code | truncate(20) }}
        </template>
        <template v-slot:item.start_datetime="{ item }">
          {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
        <template v-slot:item.end_datetime="{ item }">
          {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
        <template v-slot:item.depth="{ item }">
          {{ item | seriesDepth }}
        </template>
        <template v-slot:item.reviewed="{ item }">
          {{ item.reviewed === true ? 'Yes' : 'No' }}
        </template>
      </v-data-table>
    </v-col>
    <v-col cols="12">
      <v-alert
          type="info"
          text
          prominent
          colored-border
          border="left"
          class="body-1 font-weight-bold elevation-2"
          icon="mdi-chevron-up"
          v-if="!$route.params.seriesId"
        >
        Select a timeseries from the list.
      </v-alert>
      <router-view></router-view>
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageQaqc',
  data () {
    return {
      showReviewed: false,
      selected: [null],
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left',
          width: '80px'
        },
        {
          text: 'Station',
          value: 'station_code',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Start',
          value: 'start_datetime',
          align: 'left'
        },
        {
          text: 'End',
          value: 'end_datetime',
          align: 'left'
        },
        {
          text: 'Depth',
          value: 'depth',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Reviewed',
          value: 'reviewed',
          align: 'left'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization',
      series: 'manage/series',
      status: 'manage/seriesStatus'
    }),
    filteredSeries () {
      if (!this.series) return []

      return this.series
        .filter(d => this.showReviewed || !this.reviewed)
    }
  },
  mounted () {
    this.fetch()
  },
  watch: {
    organization () {
      this.fetch()
    },
    series () {
      if (this.$route.params.seriesId) {
        const row = this.series
          .find(d => d.id === parseInt(this.$route.params.seriesId))
        this.selected = [row]
      }
    },
    '$route.params.seriesId' (id) {
      if (!this.series) return
      this.selectFromRoute()
    }
  },
  methods: {
    async fetch () {
      await this.$store.dispatch('manage/fetchSeries')
      this.selectFromRoute()
    },
    selectFromRoute () {
      if (this.$route.params.seriesId) {
        const row = this.series
          .find(d => d.id === parseInt(this.$route.params.seriesId))
        if (row) {
          this.selected = [row]
        } else {
          this.$router.push({ name: 'manageQaqc' })
        }
      }
    },
    select (series, row) {
      if (+this.$route.params.seriesId === series.id) {
        row.select(false)
        this.$router.push({
          name: 'manageQaqc'
        })
        return
      }
      row.select(true)
      this.$router.push({ name: 'manageQaqcSeries', params: { seriesId: series.id } })
    }
  }
}
</script>
