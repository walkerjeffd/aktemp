<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="aktemp-explorer-map-stations-table elevation-20">
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
        ref="table"
        v-show="!collapse"
        v-model="selectedRows"
        :headers="headers"
        :items="filteredStations"
        :loading="loading"
        :value="selectedArray"
        :options="{ itemsPerPage: 5 }"
        @click:row="select"
        @current-items="currentItems"
        show-select
        dense
        class="row-cursor-pointer"
      >
        <template v-slot:body.prepend>
          <tr class="v-data-table-filter">
            <td>
              <v-icon>mdi-filter-outline</v-icon>
            </td>
            <td>
              <v-autocomplete
                :items="organizationCodeOptions"
                v-model="filters.organizationCodes"
                label="Select"
                multiple
                clearable
                dense
                small-chips
                deletable-chips
                hide-details
                single-line
                :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
                class="mt-4 mb-2"
              ></v-autocomplete>
            </td>
            <td>
              <v-text-field
                v-model="filters.code"
                label="Search"
                single-line
                hide-details
                clearable
                dense
                class="mt-4 mb-2"
              ></v-text-field>
            </td>
            <td>
              <v-text-field
                v-model="filters.waterbodyName"
                label="Search"
                single-line
                hide-details
                clearable
                dense
                class="mt-4 mb-2"
              ></v-text-field>
            </td>
            <td>
              <v-menu
                v-model="filters.after.show"
                :close-on-content-click="false"
                transition="scale-transition"
                top
                nudge-top="50"
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="filters.after.value"
                    label="After Date"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    class="mb-2 mt-4 pt-0"
                    hide-details
                    dense
                    clearable
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="filters.after.value"
                  no-title
                  scrollable
                  @input="filters.after.show = false"
                ></v-date-picker>
              </v-menu>
            </td>
            <td>
              <v-menu
                v-model="filters.before.show"
                :close-on-content-click="false"
                transition="scale-transition"
                top
                nudge-top="50"
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="filters.before.value"
                    label="Before Date"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    class="mb-2 mt-4 pt-0"
                    hide-details
                    dense
                    clearable
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="filters.before.value"
                  no-title
                  scrollable
                  @input="filters.before.show = false"
                ></v-date-picker>
              </v-menu>
            </td>
            <td>
              <v-text-field
                v-model="filters.seriesCountDays"
                label="Min"
                single-line
                hide-details
                clearable
                dense
                type="number"
                class="mt-4 mb-2"
              ></v-text-field>
            </td>
            <td>
              <v-text-field
                v-model="filters.profilesCount"
                label="Min"
                single-line
                hide-details
                clearable
                dense
                type="number"
                class="mt-4 mb-2"
              ></v-text-field>
            </td>
          </tr>
        </template>
        <template v-slot:item.series_period="{ item }">
          <span v-if="item.series_start_datetime && item.series_end_datetime">
            {{ item.series_start_datetime | timestamp('DD', item.timezone) }} -
            {{ item.series_end_datetime | timestamp('DD', item.timezone) }}
          </span>
        </template>
        <template v-slot:item.series_start_datetime="{ item }">
          <span v-if="item.series_start_datetime">
            {{ item.series_start_datetime | timestamp('DD', item.timezone) }}
          </span>
        </template>
        <template v-slot:item.series_end_datetime="{ item }">
          <span v-if="item.series_end_datetime">
            {{ item.series_end_datetime | timestamp('DD', item.timezone) }}
          </span>
        </template>
        <template v-slot:item.series_count_days="{ item }">
          {{ item.series_count_days | numberLocaleString }}
        </template>
        <template v-slot:item.waterbody_name="{ item }">
          {{ item.waterbody_name | truncate(30) }}
        </template>
        <template v-slot:item.profiles_count="{ item }">
          {{ item.profiles_count | numberLocaleString }}
        </template>
        <template v-slot:item.mixed="{ item }">
          <Checkbox :value="item.mixed"></Checkbox>
        </template>
        <template v-slot:item.active="{ item }">
          <Checkbox :value="item.active"></Checkbox>
        </template>
        <template v-slot:footer.prepend>
          <v-menu
            v-model="filters.advanced.show"
            top
            offset-y
            :close-on-content-click="false"
            min-width="400"
            nudge-top="10"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                outlined
                :color="advancedFilterCount > 0 ? 'warning' : null"
                class="mr-4"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon left>mdi-filter</v-icon>
                More Filters<span v-if="advancedFilterCount > 0">&nbsp;({{ advancedFilterCount }})</span>
              </v-btn>
            </template>

            <v-sheet class="pa-4">
              <div class="font-weight-bold d-flex">
                <div>Advanced Filters</div>
                <v-spacer></v-spacer>
                <v-btn x-small icon @click="filters.advanced.show = false"><v-icon small>mdi-close</v-icon></v-btn>
              </div>
              <v-select
                :items="filters.advanced.waterbodyType.options"
                v-model="filters.advanced.waterbodyType.selected"
                label="Waterbody Type"
                item-text="label"
                item-value="value"
                :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
                hide-details
                single-line
                multiple
                outlined
                clearable
                dense
                class="mt-4"
              ></v-select>
              <v-select
                :items="filters.advanced.placement.options"
                v-model="filters.advanced.placement.selected"
                label="Placement"
                item-text="label"
                item-value="value"
                :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
                hide-details
                single-line
                outlined
                clearable
                dense
                class="mt-4"
              ></v-select>
              <v-checkbox
                label="Fully Mixed Only"
                v-model="filters.advanced.mixed"
                dense
                hide-details
                class="mt-4"
              ></v-checkbox>
              <v-checkbox
                label="Active Only"
                v-model="filters.advanced.active"
                dense
                hide-details
                class="mt-4"
              ></v-checkbox>
              <div class="text-right">
                <v-btn outlined @click="clearAdvancedFilters" class="mt-4">
                  <v-icon left>mdi-close</v-icon> Clear
                </v-btn>
              </div>
            </v-sheet>
          </v-menu>
          <v-btn
            outlined
            @click="fitToStations"
            class="mr-4"
          >
            <v-icon left>mdi-fullscreen</v-icon>
            Fit Map
          </v-btn>
          <DownloadButton
            @click="download"
            title="Download stations"
            :disabled="loading"
            :text="`Download Stations ${ selectedRows.length > 0 ? ' (' + selectedRows.length + ')' : ''}`"
          />
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script>
import evt from '@/events'
import { waterbodyTypeOptions, placementOptions } from 'aktemp-utils/constants'

export default {
  name: 'ExplorerMapStationsTable',
  props: ['stations', 'selected', 'loading'],
  data () {
    return {
      collapse: false,
      selectedRows: [],
      filters: {
        organizationCodes: [],
        code: '',
        waterbodyName: '',
        seriesCountDays: '',
        profilesCount: '',
        after: {
          show: false,
          value: null
        },
        before: {
          show: false,
          value: null
        },
        advanced: {
          show: false,
          active: false,
          mixed: false,
          waterbodyType: {
            selected: [],
            options: waterbodyTypeOptions
          },
          placement: {
            selected: null,
            options: placementOptions
          }
        }
      },
      headers: [
        {
          text: 'Organization',
          value: 'organization_code',
          filter: value => this.filters.organizationCodes.length === 0 ||
            this.filters.organizationCodes.includes(value)
        },
        {
          text: 'Station',
          value: 'code',
          filter: value => !this.filters.code ||
            (value + '').toLowerCase().includes(this.filters.code.toLowerCase())
        },
        {
          text: 'Waterbody',
          value: 'waterbody_name',
          filter: value => !this.filters.waterbodyName ||
            (value + '').toLowerCase().includes(this.filters.waterbodyName.toLowerCase())
        },
        {
          text: 'Start',
          value: 'series_start_datetime',
          filter: (value, search, item) => {
            const start = this.$luxon.DateTime.fromISO(item.series_start_datetime, { zone: item.timezone })
            const end = this.$luxon.DateTime.fromISO(item.series_end_datetime, { zone: item.timezone })
            const after = this.filters.after.value
            const before = this.filters.before.value
            if (!start.isValid || !end.isValid) {
              return !after && !before
            } else if (after > before) {
              return false
            }
            return (!before || start.toISODate() <= before) &&
              (!after || end.toISODate() >= after)
          }
        },
        {
          text: 'End',
          value: 'series_end_datetime',
          filter: () => true
        },
        {
          text: '# Days',
          value: 'series_count_days',
          filter: value => !this.filters.seriesCountDays ||
            value >= parseInt(this.filters.seriesCountDays),
          width: '120px'
        },
        {
          text: '# Profiles',
          value: 'profiles_count',
          filter: value => !this.filters.profilesCount ||
            value >= parseInt(this.filters.profilesCount),
          width: '120px'
        }
      ]
    }
  },
  computed: {
    selectedArray () {
      return this.selected ? [this.selected] : []
    },
    organizationCodeOptions () {
      return [...new Set(this.stations.map(d => d.organization_code))]
    },
    advancedFilterCount () {
      return !!this.filters.advanced.active +
        !!this.filters.advanced.mixed +
        !!this.filters.advanced.placement.selected +
        (this.filters.advanced.waterbodyType.selected.length > 0)
    },
    filteredStations () {
      const waterbodyTypes = this.filters.advanced.waterbodyType.selected
      const placement = this.filters.advanced.placement.selected
      const active = this.filters.advanced.active
      const mixed = this.filters.advanced.mixed
      return this.stations
        .filter(d => (
          (waterbodyTypes.length === 0 || waterbodyTypes.includes(d.waterbody_type)) &&
          (!placement || placement === d.placement) &&
          (!active || d.active) &&
          (!mixed || d.mixed)
        ))
    }
  },
  methods: {
    clearAdvancedFilters () {
      this.filters.advanced.waterbodyType.selected = []
      this.filters.advanced.placement.selected = null
      this.filters.advanced.active = false
      this.filters.advanced.mixed = false
    },
    select (station) {
      this.$emit('select', station)
    },
    currentItems () {
      if (!this.$refs.table) return
      this.selectedRows = []
      this.$emit('filter', this.$refs.table.$children[0].filteredItems)
    },
    download () {
      let stations
      if (this.selectedRows.length > 0) {
        stations = this.selectedRows
      } else {
        stations = this.$refs.table.$children[0].filteredItems
      }
      this.$download.stations('AKTEMP-explorer-stations.csv', stations)
    },
    fitToStations () {
      evt.$emit('map:fitToStations')
    }
  }
}
</script>

<style>
.aktemp-explorer-map-stations-table {
  position: absolute;
  transform: translate(-50%, 0);
  left: 50%;
  bottom: 20px;
  width: 90%;
  background-color: white;
  pointer-events: autocomplete;
  z-index: 1000;
}

.aktemp-explorer-map-stations-table > div > .v-data-table > .v-data-table__wrapper {
  max-height: calc(50vh);
  overflow-y: auto;
  padding-bottom: 1px;
}
</style>
