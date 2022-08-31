<template>
  <v-card elevation="4" class="pb-4">
    <v-toolbar flat dense color="grey lighten-3">
      <v-toolbar-title>
        <span class="text-h6">Selected Profile</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon small class="mr-0" @click="$router.push({ name: 'manageProfiles'})"><v-icon small>mdi-close</v-icon></v-btn>
    </v-toolbar>

    <Loading v-if="loading"></Loading>
    <Alert type="error" title="Failed to Load Profile" class="mx-8 mt-8" v-else-if="error">{{ error }}</Alert>
    <v-container grid-list-xs v-else-if="profile">
      <v-row>
        <v-col cols="12" lg="6">
          <ManageProfileInfo :profile="profile"></ManageProfileInfo>
        </v-col>
        <v-col cols="12" lg="6">
          <ManageProfileChart :profile="profile"></ManageProfileChart>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import ManageProfileInfo from '@/views/manage/profiles/ManageProfileInfo'
import ManageProfileChart from '@/views/manage/profiles/ManageProfileChart'

export default {
  name: 'ManageProfile',
  components: {
    ManageProfileInfo,
    ManageProfileChart
  },
  data () {
    return {
      loading: true,
      error: null,
      profile: null
    }
  },
  watch: {
    '$route.params.profileId' () {
      this.fetch()
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null
      try {
        const response = await this.$http.restricted(`/profiles/${this.$route.params.profileId}`)
        this.profile = response.data
      } catch (err) {
        this.err = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
