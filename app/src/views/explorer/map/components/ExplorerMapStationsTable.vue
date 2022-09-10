<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div style="position:absolute;transform:translate(-50%, 0);left:50%;bottom:20px;z-index:3000;width:90%;background-color:white;pointer-events:autocomplete" class="elevation-20">
    <v-toolbar color="grey darken-2" dark flat dense>
      <div class="text-h6">Stations Table</div>
      <v-spacer></v-spacer>
      <v-btn icon small @click="collapse = !collapse">
        <v-icon small v-if="collapse">mdi-menu-up</v-icon>
        <v-icon small v-else>mdi-menu-down</v-icon>
      </v-btn>
      <v-btn icon small @click="$emit('close')">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider v-show="!collapse"></v-divider>
    <div>
      <v-data-table
        v-show="!collapse"
        :headers="headers"
        :items="filtered"
        :loading="loading"
        :value="selectedArray"
        :options="{ itemsPerPage: 5 }"
        @click:row="select"
        single-select
        dense
        class="row-cursor-pointer"
      >
        <template v-slot:top>
          <v-toolbar flat dense>
            <v-row justify="space-between">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Search station codes"
                  single-line
                  hide-details
                  clearable
                  @input="filter"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3" class="text-right">
                <DownloadButton @click="download" :disabled="loading" />
              </v-col>
            </v-row>
          </v-toolbar>
          <v-divider></v-divider>
        </template>
        <template v-slot:item.series_period="{ item }">
          <span v-if="item.series_start_datetime && item.series_end_datetime">
            {{ item.series_start_datetime | timestampTimezoneFormat(item.timezone, 'll') }} -
            {{ item.series_end_datetime | timestampTimezoneFormat(item.timezone, 'll') }}
          </span>
        </template>
        <template v-slot:item.waterbody_name="{ item }">
          {{ item.waterbody_name | truncate(30) }}
        </template>
        <template v-slot:item.profiles_period="{ item }">
          <span v-if="item.profiles_start_date && item.profiles_end_date">
            {{ item.profiles_start_date | timestampFormat('ll') }} -
            {{ item.profiles_end_date | timestampFormat('ll') }}
          </span>
        </template>
        <template v-slot:item.mixed="{ item }">
          <v-simple-checkbox
            v-model="item.mixed"
            disabled
          ></v-simple-checkbox>
        </template>
        <template v-slot:item.active="{ item }">
          <v-simple-checkbox
            v-model="item.active"
            disabled
          ></v-simple-checkbox>
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
      search: '',
      headers: [
        {
          text: 'Organization',
          value: 'organization_code',
          align: 'left'
        },
        {
          text: 'Station Code',
          value: 'code',
          align: 'left'
        },
        {
          text: 'Waterbody Name',
          value: 'waterbody_name',
          align: 'left'
        },
        {
          text: 'Waterbody Type',
          value: 'waterbody_type',
          align: 'left'
        },
        {
          text: 'Placement',
          value: 'placement',
          align: 'left'
        },
        {
          text: 'Well Mixed',
          value: 'mixed',
          align: 'left',
          width: '120px'
        },
        {
          text: 'Active',
          value: 'active',
          align: 'left',
          width: '120px'
        },
        {
          text: 'Timeseries Period',
          value: 'series_period',
          align: 'center',
          sortable: true
        },
        {
          text: 'Profiles Period',
          value: 'profiles_period',
          align: 'center'
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
      // const filtered = this.stations
      //   .filter(d => (!this.filters.search || d.code.toLowerCase().includes(this.filters.search.toLowerCase())))
      this.$emit('search', this.search)
    },
    select (station) {
      this.$emit('select', station)
    },
    download () {
      this.$download.csv(this.stations, 'AKTEMP-stations.csv')
    }
  }
}
</script>
