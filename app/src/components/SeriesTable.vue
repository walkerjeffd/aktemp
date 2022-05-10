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
    loading-text="Loading... Please wait"
    class="row-cursor-pointer elevation-2"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title class="text-h5">Timeseries</v-toolbar-title>
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
      {{ item.start_datetime | timestampTimezoneFormat(item.station_timezone, 'lll z') }}
    </template>
    <template v-slot:item.end_datetime="{ item }">
      {{ item.end_datetime | timestampTimezoneFormat(item.station_timezone, 'lll z') }}
    </template>
  </v-data-table>
</template>

<script>
const allHeaders = [
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
    text: 'Depth (m)',
    value: 'depth_m',
    align: 'left',
    width: '200px'
  },
  {
    text: 'Depth Cat.',
    value: 'depth_category',
    align: 'left',
    width: '200px'
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
        return ['id', 'station_code', 'start_datetime', 'end_datetime']
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
