<template>
  <div class="text-center">
    <div class="text-h5 mt-4 mb-8">Loading...</div>
    <v-progress-circular
      :size="size"
      :width="width"
      color="primary"
      indeterminate
    ></v-progress-circular>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    size: {
      type: Number,
      default: 50
    },
    width: {
      type: Number,
      default: 5
    }
  }
}
</script>

<style>

</style>
