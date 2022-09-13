<template>
  <v-simple-table dense>
    <tbody>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          ID
        </td>
        <td class="font-weight-bold">{{ station.id }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Organization
        </td>
        <td class="font-weight-bold">{{ station.organization_code }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Station Code
        </td>
        <td class="font-weight-bold">{{ station.code }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Coordinates
        </td>
        <td class="font-weight-bold">{{ station.latitude.toFixed(5) }}, {{ station.longitude.toFixed(5) }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Timezone
        </td>
        <td class="font-weight-bold">{{ station.timezone }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Description
        </td>
        <td class="font-weight-bold">{{ station.description | truncate(40) }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Waterbody Name
        </td>
        <td class="font-weight-bold">{{ station.waterbody_name }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Waterbody Type
        </td>
        <td class="font-weight-bold">{{ station.waterbody_type }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Placement
        </td>
        <td class="font-weight-bold">{{ station.placement }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Active
        </td>
        <td class="font-weight-bold">{{ station.active | formatBooleanOption }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Mixed
        </td>
        <td class="font-weight-bold">{{ station.mixed | formatBooleanOption }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Reference
        </td>
        <td class="font-weight-bold">{{ station.reference | truncate(40) }}</td>
      </tr>
      <tr>
        <td
          class="text-right grey--text text--darken-2"
          style="width:140px">
          Private
        </td>
        <td class="font-weight-bold">
          {{ station.private | formatBooleanOption }}
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
