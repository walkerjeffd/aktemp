<template>
  <div>
    <div>
      <v-img v-if="station.photo_url" :src="station.photo_url" contain width="90%" class="my-4 mx-auto elevation-2"></v-img>
      <div v-else>
        <div class="text-center my-4">
          <v-icon size="80" color="grey lighten-1">mdi-camera</v-icon>
          <div class="text-body-1 grey--text text--darken-1 mt-2">No Station Photo Available</div>
        </div>
      </div>
    </div>

    <v-divider></v-divider>

    <v-simple-table dense>
      <tbody>
        <tr>
          <td class="text-right grey--text text--darken-2" style="width:140px">
            Provider
          </td>
          <td class="font-weight-bold">{{ station.provider_code }}</td>
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
            Waterbody Type
          </td>
          <td class="font-weight-bold">{{ station.waterbody_type }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Waterbody Name
          </td>
          <td class="font-weight-bold">{{ station.waterbody_name }}</td>
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
          <td class="font-weight-bold">
            <Checkbox :value="station.mixed"></Checkbox>
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Active
          </td>
          <td class="font-weight-bold">
            <Checkbox :value="station.active"></Checkbox>
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Description
          </td>
          <td class="font-weight-bold">{{ station.description }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
export default {
  name: 'ExplorerMapStationInfo',
  props: ['station']
}
</script>
