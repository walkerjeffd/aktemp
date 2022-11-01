<template>
  <v-row>
    <v-col cols="12">
      <Alert
        type="info"
        title="Under Development"
        class="ma-4"
      >
        The data export tool is under development. It will allow you export all data from the database includings, stations, raw temperature values, and QAQC flags.
      </Alert>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'ManageExport'
}
</script>
