<template>
  <v-card elevation="2" class="mt-4">
    <v-toolbar dense flat color="grey lighten-3" height="40px">
      <v-toolbar-title>
        <span class="text-overline">Selected Vertical Profile</span>
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
              <ProfilesChart :profiles="[profile]" :selected="[profile]" :key="profile.id" />
            </v-sheet>
            <v-divider dark class="my-2"></v-divider>
          </div>
          <ProfilesInfo :profile="profile" @delete="$emit('delete')" @refresh="$emit('refresh')" />
        </v-col>
        <v-col cols="12" xl="6" v-if="$vuetify.breakpoint.xl">
          <v-sheet elevation="2" class="pa-4 fill-height">
            <ProfilesChart :profiles="[profile]" :selected="[profile]" :key="profile.id" />
          </v-sheet>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import ProfilesInfo from '@/components/profiles/ProfileInfo'
import ProfilesChart from '@/components/profiles/ProfilesChart'
export default {
  name: 'SelectedProfileCard',
  props: ['profile'],
  components: {
    ProfilesChart,
    ProfilesInfo
  }
}
</script>
