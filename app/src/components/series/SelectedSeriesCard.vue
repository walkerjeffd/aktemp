<template>
  <v-card elevation="2" class="mt-4">
    <v-toolbar dense flat color="grey lighten-3" height="40px">
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
          <div v-if="!$vuetify.breakpoint.xl">
            <v-sheet elevation="2" class="pa-4">
              <SeriesChart :series="[series]" :key="series.id" />
            </v-sheet>
            <v-divider dark class="my-2"></v-divider>
          </div>
          <SeriesInfo :series="series" @delete="$emit('refresh')" @refresh="$emit('refresh')" />
        </v-col>
        <v-col cols="12" xl="8" v-if="$vuetify.breakpoint.xl">
          <v-sheet elevation="2" class="pa-4">
            <SeriesChart :series="[series]" :key="series.id" />
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
