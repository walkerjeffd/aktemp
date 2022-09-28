<template>
  <div>
    <v-simple-table dense>
      <tbody>
        <tr>
          <td class="text-right grey--text text--darken-2" style="width:140px">
            Organization
          </td>
          <td class="font-weight-bold">{{ station.organization_code }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Station Code
          </td>
          <td class="font-weight-bold">{{ station.code }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Coordinates
          </td>
          <td class="font-weight-bold">{{ station.latitude.toFixed(5) }}, {{ station.longitude.toFixed(5) }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Description
          </td>
          <td class="font-weight-bold">{{ station.description }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Waterbody Name
          </td>
          <td class="font-weight-bold">{{ station.waterbody_name }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Waterbody Type
          </td>
          <td class="font-weight-bold">{{ station.waterbody_type }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Placement
          </td>
          <td class="font-weight-bold">{{ station.placement }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Fully Mixed
          </td>
          <td class="font-weight-bold">{{ station.mixed }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Active
          </td>
          <td class="font-weight-bold">{{ station.active }}</td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-divider class="mb-4"></v-divider>

    <div class="text-right mx-4 mb-4 d-flex">
      <v-btn
        color="info"
        title="Explore station data in more detail"
        :to="{ name: 'explorerStation', params: { stationId: station.id }}"
      >
        <v-icon left>mdi-chart-line</v-icon>
        Explore Data
        <!-- <v-icon right>mdi-chevron-right</v-icon> -->
      </v-btn>
      <v-spacer></v-spacer>
      <DownloadButton @click="download" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExplorerMapStationInfo',
  props: ['station'],
  methods: {
    download () {
      this.$download.csv([this.station], `AKTEMP-${this.station.organization_code}-${this.station.code}-metadata.csv`)
    }
  }
}
</script>
