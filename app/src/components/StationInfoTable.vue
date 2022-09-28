<template>
  <v-simple-table dense>
    <tbody>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:150px">
          ID
        </td>
        <td class="font-weight-bold">{{ station.id }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Organization
        </td>
        <td class="font-weight-bold">{{ station.organization_code }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Station Code
        </td>
        <td class="font-weight-bold">{{ station.code }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Coordinates
        </td>
        <td class="font-weight-bold">{{ station.latitude.toFixed(5) }}, {{ station.longitude.toFixed(5) }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Timezone
        </td>
        <td class="font-weight-bold">{{ station.timezone }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Description
        </td>
        <td class="font-weight-bold">{{ station.description | truncate(40) }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Waterbody Name
        </td>
        <td class="font-weight-bold">{{ station.waterbody_name }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Waterbody Type
        </td>
        <td class="font-weight-bold">{{ station.waterbody_type }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Placement
        </td>
        <td class="font-weight-bold">{{ station.placement }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Active
        </td>
        <td class="font-weight-bold">{{ station.active | boolean }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Mixed
        </td>
        <td class="font-weight-bold">{{ station.mixed | boolean }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Reference
        </td>
        <td class="font-weight-bold">{{ station.reference }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2">
          Private
        </td>
        <td class="font-weight-bold">
          {{ station.private | boolean }}
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script>
export default {
  name: 'StationInfoTable',
  props: ['station']
}
</script>
