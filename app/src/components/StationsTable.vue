<template>
  <div style="position:absolute;transform:translate(-50%, 0);left:50%;bottom:20px;z-index:3000;width:800px;background-color:white;pointer-events:autocomplete" class="elevation-20">
    <v-toolbar color="grey darken-2" dark flat dense>
      <div class="text-h6">Stations Table</div>
      <v-spacer></v-spacer>
      <v-btn icon small @click="collapse = !collapse">
        <v-icon small v-if="collapse">mdi-menu-down</v-icon>
        <v-icon small v-else>mdi-menu-up</v-icon>
      </v-btn>
      <v-btn icon small @click="$emit('close')">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider v-if="!collapse"></v-divider>
    <div>
      <v-data-table
        :headers="headers"
        :items="filtered"
        :loading="loading"
        :value="selectedArray"
        :options="{ itemsPerPage: 5 }"
        @click:row="select"
        single-select
        dense
        loading-text="Loading... Please wait"
        class="row-cursor-pointer"
        v-if="!collapse"
      >
        <template v-slot:top>
          <v-toolbar flat dense>
            <v-row justify="space-between">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filters.search"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                  clearable
                  @input="filter"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3" class="text-right">
                <v-btn color="info" small disabled>
                  <v-icon small left>mdi-download</v-icon>
                  CSV File
                </v-btn>
              </v-col>
            </v-row>
          </v-toolbar>
          <v-divider></v-divider>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script>
// import { mapGetters } from 'vuex'
export default {
  name: 'StationsTable',
  props: ['stations', 'filtered', 'selected', 'loading'],
  data () {
    return {
      collapse: false,
      filters: {
        search: '',
        hasImages: false,
        hasData: false,
        userOnly: false
      },
      headers: [
        {
          text: 'Organization',
          value: 'organization_id',
          align: 'left'
        },
        {
          text: 'Station Code',
          value: 'code',
          align: 'left'
        },
        {
          text: 'Latitude',
          value: 'latitude',
          align: 'right'
        },
        {
          text: 'Longitude',
          value: 'longitude',
          align: 'right'
        }
      ]
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
