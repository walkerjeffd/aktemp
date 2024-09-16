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
              <v-autocomplete
                :items="providerCodeOptions"
                v-model="filters.providerCodes"
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
            v-model="filters.spatial.show"
            top
            offset-y
            :close-on-content-click="false"
            min-width="400"
            nudge-top="10"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                outlined
                :color="spatialEnabled ? 'warning' : null"
                class="mr-4"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon left>mdi-pentagon-outline</v-icon>
                Spatial Filters
              </v-btn>
            </template>

            <v-sheet class="pa-4">
              <div class="font-weight-bold d-flex">
                <div>Spatial Filters</div>
                <v-spacer></v-spacer>
                <v-btn x-small icon @click="filters.spatial.show = false"><v-icon small>mdi-close</v-icon></v-btn>
              </div>
              <v-checkbox
                label="Enable Spatial Filters"
                v-model="spatialEnabled"
                dense
                class="mt-4"
              ></v-checkbox>
              <v-select
                :items="filters.spatial.hucLevel.options"
                :disabled="!spatialEnabled"
                v-model="hucLevel"
                label="Select HUC Level"
                item-text="label"
                item-value="value"
                :menu-props="{ closeOnClick: true, closeOnContentClick: true }"
                hide-details
                single-line
                outlined
                dense
                mandatory
              ></v-select>
              <div class="text--secondary text-subtitle-2 mt-2" v-if="spatialEnabled">
                Click on a HUC basin to filter stations within it
              </div>
              <div class="text-subtitle-1 mt-4" v-if="spatialEnabled && selectedHuc">
                Selected: <strong>{{ selectedHuc.properties.name }} ({{ selectedHuc.id }})</strong>
                <v-btn icon small @click="$emit('unselectHuc')" title="Unselect HUC"><v-icon small>mdi-close</v-icon></v-btn>
              </div>
              <div class="text-right">
                <v-btn text @click="filters.spatial.show = false" class="mt-4">
                  <v-icon left>mdi-close</v-icon> Close
                </v-btn>
              </div>
            </v-sheet>
          </v-menu>
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
                <v-icon left>mdi-filter-outline</v-icon>
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
          <v-spacer></v-spacer>
          <v-btn
            outlined
            :disabled="selectedRows.length === 0"
            @click="addToCart(selectedRows)"
          >
            <v-icon left>mdi-plus</v-icon>
            Add to Cart
          </v-btn>
          <v-btn
            outlined
            class="mx-4"
            @click="openCart"
          >
            <v-icon left>mdi-cart</v-icon>
            View Cart (<span v-if="cartStations.length === 0">Empty</span><span v-else>{{ cartStations.length}}</span>)
          </v-btn>
          <div class="mr-8 ml-4">
            Selected: {{ selectedRows.length }}
          </div>
        </template>
      </v-data-table>
    </div>

    <CartDialog ref="cart"></CartDialog>
  </div>
</template>

<script>
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

import CartDialog from '@/components/CartDialog'
import evt from '@/events'
import { waterbodyTypeOptions, placementOptions } from 'aktemp-utils/constants'
import { mapGetters } from 'vuex'

export default {
  name: 'ExplorerMapStationsTable',
  props: ['stations', 'selected', 'loading', 'selectedHuc'],
  components: { CartDialog },
  data () {
    return {
      collapse: false,
      selectedRows: [],
      filters: {
        organizationCodes: [],
        providerCodes: [],
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
        spatial: {
          show: false,
          hucLevel: {
            options: [
              { value: 'huc4', label: 'HUC4' },
              { value: 'huc6', label: 'HUC6' },
              { value: 'huc8', label: 'HUC8' }
            ]
          }
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
          text: 'Provider Group',
          value: 'organization_code',
          filter: value => this.filters.organizationCodes.length === 0 ||
            this.filters.organizationCodes.includes(value),
          width: '200px'
        },
        {
          text: 'Data Provider',
          value: 'provider_code',
          filter: value => this.filters.providerCodes.length === 0 ||
            this.filters.providerCodes.includes(value),
          width: '200px'
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
    ...mapGetters('cart', {
      cartStations: 'stations'
    }),
    spatialEnabled: {
      get () {
        return this.$store.state.map.spatialEnabled
      },
      set (value) {
        this.$store.commit('map/SET_SPATIAL_ENABLED', value)
      }
    },
    hucLevel: {
      get () {
        return this.$store.state.map.hucLevel
      },
      set (value) {
        this.$store.commit('map/SET_HUC_LEVEL', value)
      }
    },
    selectedArray () {
      return this.selected ? [this.selected] : []
    },
    organizationCodeOptions () {
      return [...new Set(this.stations.map(d => d.organization_code))].sort()
    },
    providerCodeOptions () {
      return [...new Set(this.stations.map(d => d.provider_code))].sort()
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
          (!this.selectedHuc || booleanPointInPolygon([d.longitude, d.latitude], this.selectedHuc)) &&
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
    fitToStations () {
      evt.$emit('map:fitToStations')
    },
    addToCart (stations) {
      this.$store.dispatch('cart/addStations', stations)
    },
    openCart () {
      this.$refs.cart.open()
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
