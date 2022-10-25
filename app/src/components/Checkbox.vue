<template>
  <v-simple-checkbox v-show="typeof value === 'boolean'" :value="value" disabled>
  </v-simple-checkbox>
</template>

<script>
export default {
  name: 'Checkbox',
  props: ['value']
}
</script>
