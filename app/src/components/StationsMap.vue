<template>
  <div style="height:100%">
    <v-overlay
      color="grey lighten-1"
      :value="loading || hucLayer.loading"
      absolute
      style="width:100%;height:100%;z-index:1000" class="text-center"
    >
      <div class="text-h2 font-weight-medium mb-4">Loading...</div>
      <v-progress-circular
        indeterminate
        size="64"
        width="8"
      ></v-progress-circular>
    </v-overlay>
    <l-map
      ref="map"
      style="width:100%;height:100%"
      :options="{ preferCanvas: false }"
      :center="[41,-100]"
      :zoom="3"
      @ready="$emit('ready', map)"
    >
      <l-control-layers position="topleft"></l-control-layers>
      <l-control-scale position="bottomleft"></l-control-scale>
      <l-tile-layer
        v-for="tile in basemaps"
        :key="tile.name"
        :name="tile.name"
        :visible="tile.visible"
        :url="tile.url"
        :attribution="tile.attribution"
        :options="tile.options"
        layer-type="base"
      ></l-tile-layer>

      <l-circle-marker
        v-for="s in stations"
        :key="s.id"
        :lat-lng="[s.latitude, s.longitude]"
        color="#3388ff"
        @click="$emit('select', s)"
      >
        <l-tooltip>
          Station: <strong>{{s.code}}</strong><br/>
          Provider: <strong>{{s.organization_code}}</strong>
        </l-tooltip>
      </l-circle-marker>
      <l-circle-marker
        v-if="station"
        key="selected"
        :lat-lng="[station.latitude, station.longitude]"
        color="orangered"
        @click="$emit('select')"
      >
        <l-tooltip>
          Station: <strong>{{station.code}}</strong><br/>
          Provider: <strong>{{station.organization_code}}</strong>
        </l-tooltip>
      </l-circle-marker>
      <l-geo-json
        v-if="!!showHucLevel && hucLayer.data"
        ref="huc"
        :geojson="hucLayer.data"
        :options="hucLayer.options"
        :options-style="hucLayer.style"
        pane="overlayPane"
        @click="clickHucLayer"
      />
      <l-geo-json
        v-if="selectedHuc"
        :geojson="selectedHuc"
        :options="selectedHucLayer.options"
        :options-style="selectedHucLayer.style"
        pane="overlayPane"
        @click="clickHucLayer"
      />
    </l-map>
    <!-- <slot v-if="ready"></slot> -->
  </div>
</template>

<script>
import { LMap, LTileLayer, LGeoJson, LControlLayers, LControlScale, LCircleMarker, LTooltip } from 'vue2-leaflet'

import evt from '@/events'
import { mapGetters } from 'vuex'

const basemaps = [
  {
    name: 'ESRI World Imagery',
    visible: true,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  {
    name: 'USGS Imagery',
    visible: false,
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="http://www.usgs.gov">U.S. Geological Survey</a> | <a href="http://www.usgs.gov/laws/policies_notices.html">Policies</a>',
    options: {
      maxZoom: 16
    }
  },
  {
    name: 'USGS Topo',
    visible: false,
    url: 'https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="http://www.usgs.gov">U.S. Geological Survey</a> | <a href="http://www.usgs.gov/laws/policies_notices.html">Policies</a>',
    options: {
      maxZoom: 16
    }
  },
  {
    name: 'USGS Hydrography',
    visible: false,
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="http://www.usgs.gov">U.S. Geological Survey</a> | <a href="http://www.usgs.gov/laws/policies_notices.html">Policies</a>',
    options: {
      maxZoom: 16
    }
  },
  {
    name: 'OpenStreetMap',
    visible: false,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'No Basemap',
    visible: false,
    url: '',
    attribution: ''
  }
]

export default {
  name: 'StationsMap',
  props: {
    loading: {
      type: Boolean,
      required: false,
      default: false
    },
    station: {
      type: Object,
      required: false
    },
    stations: {
      type: Array,
      required: false,
      default: () => []
    },
    selectedHuc: {
      type: Object,
      required: false
    }
  },
  components: {
    LMap,
    LControlLayers,
    LControlScale,
    LTileLayer,
    LCircleMarker,
    LGeoJson,
    LTooltip
  },
  data: () => ({
    basemaps,
    ready: false,
    hucLayer: {
      loading: false,
      data: null,
      options: {},
      style: null
    },
    selectedHucLayer: {
      options: {
        onEachFeature (feature, layer) {
          layer.bindTooltip(
            `HUC ID: <strong>${feature.id}</strong><br>Name: <strong>${feature.properties.name}</strong>`,
            { permanent: false, sticky: true }
          )
        }
      },
      style: () => {
        return {
          weight: 2,
          color: 'orangered',
          opacity: 1,
          // fillColor: 'lightblue',
          fillOpacity: 0
        }
      }
    }
  }),
  computed: {
    ...mapGetters('map', {
      spatialEnabled: 'spatialEnabled',
      hucLevel: 'hucLevel'
    }),
    showHucLevel () {
      return this.spatialEnabled ? this.hucLevel : null
    },
    selectedStationId () {
      return this.station ? this.station.id : null
    }
  },
  mounted () {
    this.map = this.$refs.map.mapObject
    window.map = this.map
    this.map.createPane('huc')
    evt.$on('map:zoomToStation', this.zoomToStation)
    evt.$on('map:fitToStations', this.fitToStations)

    this.ready = true

    this.fitToStations()
    this.loadHucLayer()
  },
  beforeDestroy () {
    evt.$off('map:zoomToStation', this.zoomToStation)
    evt.$off('map:fitToStations', this.fitToStations)
  },
  watch: {
    stations (val, old) {
      if (!old || old.length === 0) this.fitToStations()
    },
    selectedHuc (val) {
      this.styleHucs()
    },
    showHucLevel () {
      this.loadHucLayer()
    }
  },
  methods: {
    async loadHucLayer () {
      this.hucLayer.loading = true
      console.log('loadHucLayer', this.hucLevel)
      this.$emit('select-huc')
      const response = await fetch(`static/gis/wbd_${this.hucLevel}.geojson`)
      const data = await response.json()
      this.hucLayer.data = data
      this.hucLayer.options = {
        onEachFeature (feature, layer) {
          layer.bindTooltip(
            `HUC ID: <strong>${feature.id}</strong><br>Name: <strong>${feature.properties.name}</strong>`,
            { permanent: false, sticky: true }
          )
        }
      }
      this.hucLayer.style = () => {
        return {
          weight: 2,
          color: 'lightblue',
          opacity: 1,
          fillOpacity: 0
        }
      }
      console.log('done')
      this.hucLayer.loading = false
    },
    styleHucs () {
      if (!this.$refs.huc || !this.$refs.huc.mapObject) return
      this.$refs.huc.mapObject.eachLayer(layer => {
        window.layer = layer
        if (this.selectedHuc && layer.feature.id === this.selectedHuc.id) {
          layer.setStyle({
            color: 'red'
          })
        } else {
          layer.setStyle({
            color: 'lightblue'
          })
        }
      })
    },
    clickHucLayer (evt) {
      const feature = evt.layer.feature
      this.$emit('select-huc', feature)
    },
    zoomToStation (station) {
      this.map.flyTo([station.latitude, station.longitude], 12)
    },
    fitToStations () {
      if (!this.stations || this.stations.length === 0) return

      if (this.stations.length === 1) {
        return this.map.setView([
          this.stations[0].latitude,
          this.stations[0].longitude
        ], 12)
      }

      const latitudes = this.stations.map(d => d.latitude)
      const longitudes = this.stations.map(d => d.longitude)
      const minX = Math.min(...longitudes)
      const maxX = Math.max(...longitudes)
      const minY = Math.min(...latitudes)
      const maxY = Math.max(...latitudes)
      const bounds = [
        [minY, minX],
        [maxY, maxX]
      ]
      this.map.fitBounds(bounds, { padding: [200, 200] })
    }
  }
}
</script>

<style>
/* .aktemp-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: red;
} */
</style>
