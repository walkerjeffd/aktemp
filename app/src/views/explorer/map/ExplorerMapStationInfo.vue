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
