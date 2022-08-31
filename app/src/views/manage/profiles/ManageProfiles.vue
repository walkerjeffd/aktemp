<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-row>
    <v-col cols="12" xl="4">
      <Alert type="error" title="Failed to Load Profiles" class="ma-4" v-if="status.error">{{ status.error }}</Alert>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="profiles"
        :loading="status.loading"
        :options="{ itemsPerPage: 10 }"
        @click:row="select"
        single-select
        loading-text="Loading... Please wait"
        class="row-cursor-pointer elevation-2"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title class="text-h5">Vertical Profiles</v-toolbar-title>
            <v-spacer></v-spacer>
            <RefreshButton @click="fetch"></RefreshButton>
          </v-toolbar>
          <div class="body-2 text--secondary mx-4 mb-2">
            <v-icon small>mdi-information-outline</v-icon>
            Click on a row to view the profile
          </div>
          <v-divider></v-divider>
        </template>
        <template v-slot:item.station_code="{ item }">
          {{ item.station_code | truncate(20) }}
        </template>
        <template v-slot:item.date="{ item }">
          {{ item.date | timestampTimezoneFormat(item.station_timezone, 'll') }}
        </template>
      </v-data-table>
    </v-col>
    <v-col cols="12" xl="8">
      <v-alert
          type="info"
          text
          prominent
          colored-border
          border="left"
          class="body-1 font-weight-bold mx-4 elevation-2"
          icon="mdi-chevron-left"
          v-if="!$route.params.profileId"
        >
        Select a profile from the list.
      </v-alert>
      <router-view></router-view>
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ManageProfiles',
  data () {
    return {
      selected: [null],
      headers: [
        {
          text: 'ID',
          value: 'id',
          align: 'left',
          width: '80px'
        },
        {
          text: 'Station',
          value: 'station_code',
          align: 'left',
          width: '200px'
        },
        {
          text: 'Date',
          value: 'date',
          align: 'left'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      organization: 'manage/organization',
      profiles: 'manage/profiles',
      status: 'manage/profilesStatus'
    })
  },
  mounted () {
    this.fetch()
  },
  watch: {
    organization () {
      this.fetch()
    },
    profiles () {
      if (this.$route.params.profileId) {
        const row = this.profiles
          .find(d => d.id === parseInt(this.$route.params.profileId))
        this.selected = [row]
      }
    },
    '$route.params.profileId' (id) {
      if (!this.profiles) return
      this.selectFromRoute()
    }
  },
  methods: {
    async fetch () {
      await this.$store.dispatch('manage/fetchProfiles')
      this.selectFromRoute()
    },
    selectFromRoute () {
      if (this.$route.params.profileId) {
        const row = this.profiles
          .find(d => d.id === parseInt(this.$route.params.profileId))
        if (row) {
          this.selected = [row]
        } else {
          this.$router.push({ name: 'manageProfiles' })
        }
      }
    },
    select (profile, row) {
      if (+this.$route.params.profileId === profile.id) {
        row.select(false)
        this.$router.push({
          name: 'manageProfiles'
        })
        return
      }
      row.select(true)
      this.$router.push({ name: 'manageProfile', params: { profileId: profile.id } })
    }
  }
}
</script>
