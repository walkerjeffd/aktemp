<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-data-table
    :headers="headers"
    :items="series"
    :loading="loading"
    :value="selectedArray"
    :options="{ itemsPerPage: 5 }"
    @click:row="select"
    single-select
    dense
    loading-text="Loading... Please wait"
    class="row-cursor-pointer elevation-2"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title class="text-h6">Timeseries</v-toolbar-title>
      </v-toolbar>
      <div class="body-2 text--secondary mx-4 mb-2">
        <v-icon small>mdi-information-outline</v-icon>
        Click on a row to view the timeseries
      </div>
      <v-divider></v-divider>
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
  </v-data-table>
</template>

<script>
const allHeaders = [
  {
    text: 'ID',
    value: 'id',
    width: '80px'
  },
  {
    text: 'Station',
    value: 'station_code'
  },
  {
    text: 'Start',
    value: 'start_datetime'
  },
  {
    text: 'End',
    value: 'end_datetime'
  },
  {
    text: 'Depth Category',
    value: 'depth_category'
  },
  {
    text: 'Depth (m)',
    value: 'depth_m'
  },
  {
    text: 'Interval',
    value: 'interval'
  },
  {
    text: 'Reviewed',
    value: 'reviewed'
  }
]

export default {
  name: 'SeriesTable',
  props: {
    series: {
      type: Array
    },
    selected: {
      type: Object
    },
    loading: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default () {
        return allHeaders.map(d => d.value)
      }
    }
  },
  data () {
    return {
      collapse: false,
      headers: allHeaders.filter(d => this.columns.includes(d.value))
    }
  },
  computed: {
    selectedArray () {
      // wrap in array for v-data-table in StationTable
      return this.selected ? [this.selected] : []
    }
  },
  methods: {
    filter () {
      const filtered = this.stations
        .filter(d => (!this.filters.search || d.code.toLowerCase().includes(this.filters.search.toLowerCase())))
      this.$emit('filter', filtered)
    },
    select (station) {
      this.$emit('select', station)
    }
  }
}
</script>
