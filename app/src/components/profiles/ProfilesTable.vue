<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-data-table
    :headers="headers"
    :items="profiles"
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
        <v-toolbar-title class="text-h6">Vertical Profiles</v-toolbar-title>
      </v-toolbar>
      <div class="body-2 text--secondary mx-4 mb-2">
        <v-icon small>mdi-information-outline</v-icon>
        Click on a row to view the profile
      </div>
      <v-divider></v-divider>
    </template>
    <template v-slot:item.station_code="{ item }">
      {{ item.station_code | truncate(20) }}
    </template>
    <template v-slot:item.date="{ item }">
      {{ item.date | timestamp('DD') }}
    </template>
    <template v-slot:item.values_count="{ item }">
      {{ item.values_count | numberLocaleString }}
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
    value: 'station_code',
    width: '200px'
  },
  {
    text: 'Date',
    value: 'date'
  },
  {
    text: '# Values',
    value: 'values_count'
  }
]

export default {
  name: 'ProfilesTable',
  props: {
    profiles: {
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
    select (profile) {
      this.$emit('select', profile)
    }
  }
}
</script>
