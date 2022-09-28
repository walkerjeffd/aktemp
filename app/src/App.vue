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

      <v-btn text exact :to="{ name: 'home' }">
        <v-icon small left>mdi-home</v-icon>Home
      </v-btn>
      <v-btn text exact :to="{ name: 'explorer' }">
        <v-icon small left>mdi-earth</v-icon>Data Explorer
      </v-btn>

      <v-divider vertical class="mx-4"></v-divider>

      <v-btn text class="mx-2" v-if="user" :to="{ name: 'manage' }">
        <v-icon small left>mdi-cogs</v-icon>Manage Data
      </v-btn>
      <v-menu
        left
        bottom
        offset-y
        z-index="2000"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            text
            dark
            v-bind="attrs"
            v-on="on"
            class="ml-2"
          >
            <v-icon left>mdi-account</v-icon> Account
          </v-btn>
        </template>

        <!-- LOGGED IN -->
        <v-list v-if="user">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="text-left">
                <span class="text--secondary text-caption mb-2">Logged In</span><br>
                {{user.attributes.name | truncate(40)}}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item v-if="user && user.isAdmin" :to="{ name: 'admin' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-badge-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Admin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'account' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-cogs</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="logout" to="" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Log Out</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- NOT LOGGED IN -->
        <v-list v-else>
          <v-list-item :to="{ name: 'request' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Request Account</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'login' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-login</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Log In</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- <v-main> -->
    <router-view/>
    <!-- </v-main> -->

    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color" :top="true" elevation="12" light outlined text style="z-index:1000">
      <span class="font-weight-bold">{{ snackbar.text }}</span>
      <template v-slot:action="{ attrs }">
        <v-btn :color="snackbar.color" icon text v-bind="attrs" @click="snackbar.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex'

import evt from '@/events'

export default {
  name: 'App',
  data () {
    return {
      snackbar: {
        show: false,
        color: 'primary',
        text: null,
        timeout: 5000
      }
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    evt.$on('notify', this.notify)
  },
  beforeDestroy () {
    evt.$off('notify', this.notify)
  },
  methods: {
    notify (text, color) {
      this.snackbar.color = color
      this.snackbar.text = text
      this.snackbar.show = true
    },
    async logout () {
      console.log('App:logout')
      try {
        await this.$Amplify.Auth.signOut()
        evt.$emit('notify', 'You have been logged out', 'success')
        evt.$emit('authState', { state: 'signedOut', redirect: { name: 'home' } })
      } catch (err) {
        console.log(err)
        evt.$emit('notify', 'Failed to log out', 'error')
      }
    }
  }
}
</script>
