<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12" sm="8" md="6" lg="5" xl="4" class="pt-8">
          <router-view></router-view>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import evt from '@/events'

export default {
  name: 'Auth',
  data () {
    return {
      user: {
        username: null,
        email: null
      }
    }
  },
  mounted () {
    evt.$on('localUser', this.setLocalUser)
  },
  beforeDestroy () {
    evt.$off('localUser', this.setLocalUser)
  },
  methods: {
    setLocalUser (user) {
      this.user = user
    }
  }
}
</script>

<style>

</style>
