<template>
  <v-main>
    <v-container class="mt-4">
      <v-row>
        <v-col>
          <div class="text-h3 text-center">Welcome to AKTEMP</div>
          <div class="text-center mt-8">
            <v-btn color="primary" x-large :to="{ name: 'explorer' }">
              Open Data Explorer
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>

export default {
  name: 'Home'
}
</script>
