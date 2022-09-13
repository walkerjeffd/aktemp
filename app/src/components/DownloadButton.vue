<template>
  <v-btn :disabled="disabled" title="Download CSV File" @click="$emit('click')">
    <v-icon small left>mdi-download</v-icon>
    CSV
  </v-btn>
</template>

<script>
export default {
  name: 'DownloadButton',
  props: ['disabled']
}
</script>
