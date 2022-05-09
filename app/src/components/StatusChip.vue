<template>
  <v-chip small label outlined :color="color" class="font-weight-bold">{{ status }}</v-chip>
</template>

<script>
export default {
  name: 'StatusChip',
  props: ['status'],
  computed: {
    color () {
      const colors = {
        CREATED: 'primary',
        UPLOADING: 'warning',
        UPLOADED: 'primary',
        QUEUED: 'primary',
        PROCESSING: 'warning',
        DONE: 'success',
        FAILED: 'error'
      }
      return colors[this.status] || 'primary'
    }
  }
}
</script>

<style>

</style>
