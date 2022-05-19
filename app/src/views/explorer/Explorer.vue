<template>
  <div class="fill-height">
    <v-navigation-drawer app clipped dark expand-on-hover style="z-index:2000">
      <v-list-item link @click="pane = 'filters'">
        <v-list-item-icon>
          <v-icon>mdi-filter</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Filter Stations
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link @click="pane = 'map'">
        <v-list-item-icon>
          <v-icon>mdi-map</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Map Settings
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link @click="stationsTable.show = true">
        <v-list-item-icon>
          <v-icon>mdi-table</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Stations Table
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-navigation-drawer>
    <v-main class="fill-height">
      <div class="d-flex flex-row fill-height">
        <!-- FILTER -->
        <v-navigation-drawer color="grey darken-2" v-if="pane === 'filters'" width="350">
          <v-toolbar color="grey darken-2" dark flat dense>
            <div class="text-h6">Filter Stations</div>
            <v-spacer></v-spacer>
            <v-btn icon small @click="pane = null">
              <v-icon small>mdi-chevron-double-left</v-icon>
            </v-btn>
          </v-toolbar>
          <v-divider></v-divider>
          <div class="pa-4 white--text">
            <v-select
              :items="storeOrganizations"
              v-model="filters.organization.selected"
              label="Organization"
              item-text="code"
              item-value="id"
              hide-details
              multiple
              outlined
              dark
              clearable
              @input="filter"
              class="mb-4"
            ></v-select>
            <v-select
              :items="filters.waterbodyType.options"
              v-model="filters.waterbodyType.selected"
              label="Waterbody Type"
              item-text="label"
              item-value="value"
              hide-details
              multiple
              outlined
              dark
              clearable
              @input="filter"
              class="mb-4"
            ></v-select>
            <v-switch
              v-model="filters.active"
              label="Active"
              validate-on-blur
              outlined
              hide-details
              dark
              @change="filter"
            ></v-switch>
            <v-switch
              v-model="filters.series"
              label="Timeseries Data"
              validate-on-blur
              outlined
              hide-details
              dark
              @change="filter"
            ></v-switch>
            <v-switch
              v-model="filters.profiles"
              label="Profile Data"
              validate-on-blur
              outlined
              hide-details
              dark
              @change="filter"
            ></v-switch>
            <v-divider dark class="my-4"></v-divider>
            <p class="font-weight-bold">Filter by Time (calendar pickers):</p>
            <ul class="mb-4">
              <li>Min date</li>
              <li>Max date</li>
            </ul>
            <p class="font-weight-bold">Spatial Filter:</p>
            <ul class="mb-4">
              <li>Button to enable "draw" mode (user can then filter by drawing a bounding box or polygon)</li>
            </ul>
          </div>
        </v-navigation-drawer>
        <!-- SETTINGS -->
        <v-navigation-drawer color="grey darken-2" v-else-if="pane === 'map'" width="350">
          <v-toolbar color="grey darken-2" dark flat dense>
            <div class="text-h6">Map Settings</div>
            <v-spacer></v-spacer>
            <v-btn icon small @click="pane = null">
              <v-icon small>mdi-chevron-double-left</v-icon>
            </v-btn>
          </v-toolbar>
          <v-divider></v-divider>
          <div class="pa-4 white--text">
            <p class="font-weight-bold">Color Stations By (dropdown menu):</p>
            <ul class="mb-4">
              <li>Organization</li>
              <li>Waterbody Type</li>
              <li>Placement</li>
              <li>Active</li>
              <li>Well-mixed</li>
            </ul>
          </div>
        </v-navigation-drawer>
        <!-- MAP -->
        <div style="background-color:red;position:relative" class="flex-grow-1">
          <StationsMap
            :loading="stationsStatus.loading"
            :stations="stations.filtered"
            :station="stations.selected"
            @select="select"
          />
          <StationsTable
            v-show="stationsTable.show"
            :loading="stationsStatus.loading"
            :stations="storeStations"
            :filtered="stations.filtered"
            :selected="stations.selected"
            @select="select"
            @search="filterCodeSearch"
            @close="stationsTable.show = false"
          />
          <StationDetail
            v-if="!!stations.selected"
            :station="stations.selected"
            @close="select"
          />
        </div>
      </div>
    </v-main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { waterbodyTypeOptions } from '@/lib/constants'

import StationsMap from '@/components/StationsMap'
import StationsTable from '@/components/StationsTable'
import StationDetail from '@/components/StationDetail'

export default {
  name: 'Explorer',
  components: {
    StationsMap,
    StationsTable,
    StationDetail
  },
  data () {
    return {
      stations: {
        filtered: [],
        selected: null
      },
      filters: {
        organization: {
          selected: []
        },
        waterbodyType: {
          selected: [],
          options: waterbodyTypeOptions
        },
        active: false,
        series: false,
        profiles: false,
        code: {
          search: ''
        }
      },
      tab: 0,
      pane: null,
      stationsTable: {
        show: false
      }
    }
  },
  computed: {
    ...mapGetters({
      storeOrganizations: 'explorer/organizations',
      storeStations: 'explorer/stations',
      stationsStatus: 'explorer/stationsStatus',
      organizationsStatus: 'explorer/organizationsStatus'
    })
  },
  watch: {
    storeStations () {
      this.stations.filtered = this.storeStations
    }
  },
  async created () {
    // try {
    //   const response = await this.$http.public.get('/stations')
    //   this.stations.all = response.data
    //   this.stations.filtered = this.stations.all
    // } catch (e) {
    //   alert('Error occurred fetching stations')
    //   console.log(e)
    // } finally {
    //   this.loading = false
    // }
    this.$store.dispatch('explorer/fetchOrganizations')
    this.$store.dispatch('explorer/fetchStations')
  },
  methods: {
    select (station) {
      if (station && this.stations.selected !== station) {
        this.stations.selected = station
      } else {
        this.stations.selected = null
      }
    },
    filterCodeSearch (value) {
      this.filters.code.search = value
      this.filter()
    },
    filter () {
      console.log('filter', this.filters.active.value)
      const codeSearchString = this.filters.code.search.toLowerCase()
      this.stations.filtered = this.storeStations
        .filter(d => (!this.filters.code.search || d.code.toLowerCase().includes(codeSearchString)))
        .filter(d => (this.filters.organization.selected.length === 0 || this.filters.organization.selected.includes(d.organization_id)))
        .filter(d => (this.filters.waterbodyType.selected.length === 0 || this.filters.waterbodyType.selected.includes(d.waterbody_type)))
        .filter(d => this.filters.active !== true || d.active === true)
        .filter(d => this.filters.series !== true || d.series_count > 0)
        .filter(d => this.filters.profiles !== true || d.profiles_count > 0)

      if (!this.stations.filtered.includes(this.stations.selected)) {
        this.select()
      }
    }
  }
}
</script>
