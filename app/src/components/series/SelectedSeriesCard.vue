<template>
  <v-card elevation="4" class="mt-4">
    <v-toolbar dense color="grey lighten-3" height="40px" elevation="2">
      <v-toolbar-title>
        <span class="text-overline">Selected Timeseries</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon x-small @click="$emit('close')" class="mr-0">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text>
      <v-row>
        <v-col cols="12" xl="4">
          <div class="d-xl-none">
            <v-sheet elevation="2" class="pa-4">
              <SeriesChart :series="series" />
            </v-sheet>
            <v-divider dark></v-divider>
          </div>
          <SeriesInfo :series="series" @delete="$emit('delete')" />
        </v-col>
        <v-col cols="12" xl="8">
          <v-sheet elevation="2" class="pa-4 d-none d-xl-flex">
            <SeriesChart :series="series" />
          </v-sheet>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import SeriesInfo from '@/components/series/SeriesInfo'
import SeriesChart from '@/components/series/SeriesChart'
export default {
  name: 'SelectedSeriesCard',
  props: ['series'],
  components: {
    SeriesChart,
    SeriesInfo
  }
}
</script>
