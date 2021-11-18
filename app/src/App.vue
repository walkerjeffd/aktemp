<template>
  <v-app>
    <v-app-bar
      app
      color="#00573d"
      dark
      clipped-left
    >
      <v-toolbar-title>AKTEMP</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn text exact :to="{ name: 'home' }">Home</v-btn>
      <v-btn text exact :to="{ name: 'explorer' }">Data Explorer</v-btn>
    </v-app-bar>

    <!-- <v-main> -->
    <router-view/>
    <!-- </v-main> -->
  </v-app>
</template>

<script>
export default {
  name: 'App'
}
</script>
