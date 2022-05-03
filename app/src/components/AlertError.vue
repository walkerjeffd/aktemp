<template>
  <v-alert
    type="error"
    text
    colored-border
    border="left"
    class="body-2 mb-0 mt-4"
    :value="true"
  >
    <div class="font-weight-bold body-1">{{ title }}</div>
    <slot></slot>
  </v-alert>
</template>

<script>
export default {
  name: 'AlertError',
  props: ['title']
}
</script>
