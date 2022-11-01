<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-row>
    <v-col cols="12">
      <Alert type="error" title="Server Error" class="ma-4" v-if="error">{{ error }}</Alert>
      <Alert type="error" title="Failed to Load Series" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
      <v-data-table
        ref="table"
        v-model="selected"
        :headers="headers"
        :items="filteredSeries"
        :loading="status.loading || saving"
        :options="{ itemsPerPage: 10 }"
        @click:row="select"
        show-select
        loading-text="Loading... Please wait"
        class="row-cursor-pointer elevation-2"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title class="text-h6">Timeseries</v-toolbar-title>
            <v-spacer></v-spacer>
            <RefreshButton @click="fetch"></RefreshButton>
          </v-toolbar>
          <div class="body-2 text--secondary mx-4 mb-2">
            <v-icon small>mdi-information-outline</v-icon>
            Click on a row to review the timeseries.<br>
            Only timeseries that need to be reviewed are shown by default. Click the checkbox under <code>Reviewed</code> on the filter row (<v-icon small>mdi-filter-outline</v-icon>) to see reviewed timeseries.
          </div>
          <v-divider></v-divider>
        </template>

        <template v-slot:body.prepend>
          <tr class="v-data-table-filter">
            <td>
              <v-icon>mdi-filter-outline</v-icon>
            </td>
            <td></td>
            <td></td>
            <td>
              <v-text-field
                v-model="filters.stationCode"
                label="Search"
                single-line
                hide-details
                clearable
                dense
                class="mt-4 mb-2"
              ></v-text-field>
            </td>
            <td></td>
            <td></td>
            <!-- <td></td>
            <td></td> -->
            <td>
              <v-checkbox
                v-model="filters.reviewed"
                hide-details
                label=""
                class="mt-0"
              ></v-checkbox>
            </td>
          </tr>
        </template>
        <template v-slot:item.created_at="{ item }">
          {{ item.created_at | timestamp('ff', 'local') }}
        </template>
        <template v-slot:item.station_code="{ item }">
          {{ item.station_code | truncate(20) }}
        </template>
        <template v-slot:item.start_datetime="{ item }">
          {{ item.start_datetime | timestamp('DD', item.station_timezone) }}
        </template>
        <template v-slot:item.end_datetime="{ item }">
          {{ item.end_datetime | timestamp('DD', item.station_timezone) }}
        </template>
        <template v-slot:item.reviewed="{ item }">
          <Checkbox :value="item.reviewed"></Checkbox>
        </template>
        <template v-slot:footer.prepend>
          <v-btn
            small
            outlined
            :disabled="selected.length === 0"
            :loading="saving"
            @click="markSelectedAsReviewed"
          >
            <v-icon left>mdi-check</v-icon> Mark as Reviewed <span v-if="selected.length > 0">&nbsp;({{selected.length}})</span>
          </v-btn>
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
      saving: false,
      error: null,
      showReviewed: true,
      selected: [],
      filters: {
        stationCode: '',
        reviewed: false
      },
      headers: [
        {
          text: 'ID',
          value: 'id',
          width: '80px'
        },
        {
          text: 'Uploaded',
          value: 'created_at'
        },
        {
          text: 'Station',
          value: 'station_code',
          filter: value => !this.filters.stationCode || (value + '').toLowerCase().includes(this.filters.stationCode.toLowerCase())
        },
        {
          text: 'Start',
          value: 'start_datetime'
        },
        {
          text: 'End',
          value: 'end_datetime'
        },
        // {
        //   text: 'Depth Category',
        //   value: 'depth_category'
        // },
        // {
        //   text: 'Depth (m)',
        //   value: 'depth_m'
        // },
        {
          text: 'Reviewed',
          value: 'reviewed',
          filter: value => this.filters.reviewed === value,
          width: '120px'
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
        .filter((d) => (this.showReviewed || !d.reviewed))
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
      if (!this.series) return
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
      this.selected = []
      this.selectFromRoute()
    },
    selectFromRoute () {
      // console.log('selectFromRoute')
      if (this.$route.params.seriesId) {
        const row = this.series
          .find(d => d.id === parseInt(this.$route.params.seriesId))
        if (row) {
          this.selected = [row]
        }
      } else if (this.$route.params.refresh) {
        console.log('refresh', this.selected)

        if (this.selected.length > 0) {
          const rows = this.$refs.table.$children[0].filteredItems
          const index = rows.findIndex(d => d === this.selected[0])
          if (index >= 0 && index < rows.length - 1) {
            this.$router.push({ name: 'manageQaqcSeries', params: { seriesId: rows[index + 1].id } })
          } else {
            this.selected = []
          }
        }
        this.$store.dispatch('manage/fetchSeries')
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
    },
    async markSelectedAsReviewed () {
      this.error = null
      this.saving = true
      try {
        for (let i = 0; i < this.selected.length; i++) {
          const series = this.selected[i]
          await this.$http.restricted.put(`/series/${series.id}`, { reviewed: true })
        }
        await this.fetch()
        this.selected = []
        // this.$router.push({
        //   name: 'manageQaqc'
        // })
      } catch (err) {
        this.error = this.$errorMessage(err)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
