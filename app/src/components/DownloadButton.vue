<template>
  <v-btn title="Download CSV File" @click="$emit('click')" outlined v-bind="$attrs">
    <v-icon small left>mdi-download</v-icon>
    {{ text || 'Download' }}
  </v-btn>
</template>

<script>
export default {
  name: 'DownloadButton',
  props: ['text']
}
</script>
