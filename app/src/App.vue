<template>
  <v-app>
    <v-app-bar
      v-if="$vuetify.breakpoint.mdAndUp"
      app
      color="#00583D"
      dark
      clipped-left
      style="z-index:1000"
    >
      <v-toolbar-title>
        <a href="https://accs.uaa.alaska.edu/">
          <v-img src="@/assets/img/accs-logo.png" alt="ACCS logo" contain width="200" style="background-color:white"></v-img>
        </a>
      </v-toolbar-title>
      <span class="text-h5 text-center ml-4" v-if="$vuetify.breakpoint.lgAndUp">AKTEMP Water Temperature Database</span>
      <span class="text-h5 text-center ml-4" v-else>AKTEMP</span>

      <v-spacer></v-spacer>

      <v-btn text exact class="mx-2" :to="{ name: 'home' }">
        <v-icon small left>mdi-home</v-icon>Home
      </v-btn>
      <v-btn text exact class="mx-2" href="https://aktemp.uaa.alaska.edu/viz/">
        <v-icon small left>mdi-chart-line</v-icon>Data Viz
      </v-btn>
      <v-btn text exact class="mx-2" :to="{ name: 'explorer' }">
        <v-icon small left>mdi-database</v-icon>Database Explorer
      </v-btn>
      <v-btn text exact class="mx-2" href="https://accscatalog.uaa.alaska.edu/dataset/aktemp-water-temperature-database" target="_blank">
        <v-icon small left>mdi-book-outline</v-icon>User Guide
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
          <v-list-item v-if="user && user.isAdmin" exact :to="{ name: 'admin' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-badge-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Admin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'account' }" exact class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-cogs</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="logout" class="pr-12" exact active-class="logout-active-class">
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
          <v-list-item :to="{ name: 'request' }" exact class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Request Account</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'login' }" exact class="pr-12">
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

    <v-app-bar
      v-else
      app
      color="#00583D"
      dark
      clipped-left
      style="z-index:1000"
    >
      <v-toolbar-title>
        <a href="https://accs.uaa.alaska.edu/">
          <v-img src="@/assets/img/accs-logo.png" alt="ACCS logo" contain width="150" style="background-color:white"></v-img>
        </a>
      </v-toolbar-title>
      <span class="text-h4 text-center ml-4">AKTEMP</span>

      <v-spacer></v-spacer>

      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item :to="{ name: 'home' }" exact>
            <v-list-item-avatar>
              <v-icon small left>mdi-home</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item :to="{ name: 'explorer' }" exact>
            <v-list-item-avatar>
              <v-icon small left>mdi-chart-line</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>Data Explorer</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item href="https://accscatalog.uaa.alaska.edu/dataset/aktemp-water-temperature-database" target="_blank" exact>
            <v-list-item-avatar>
              <v-icon small left>mdi-book-outline</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>User Guide</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- LOGGED IN -->
        <v-list v-if="user">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="text-left">
                <span class="text--secondary text-caption mb-2">Logged In As</span><br>
                {{user.attributes.name | truncate(40)}}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item :to="{ name: 'manage' }" exact>
            <v-list-item-icon>
              <v-icon>mdi-table</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Manage Data</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="user && user.isAdmin" exact :to="{ name: 'admin' }">
            <v-list-item-icon>
              <v-icon>mdi-badge-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Admin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'account' }" exact>
            <v-list-item-icon>
              <v-icon>mdi-cogs</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="logout" exact active-class="logout-active-class">
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
          <v-divider></v-divider>
          <v-list-item :to="{ name: 'request' }" exact class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Request Account</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'login' }" exact class="pr-12">
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

    <router-view/>

    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color" :top="true" elevation="12" light outlined text style="z-index:5000">
      <span class="font-weight-bold" v-html="snackbar.text"></span>
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
  errorCaptured (err) {
    console.log(err)
    evt.$emit('notify', `Unexpected error occurred<br><br>${this.$errorMessage(err)}`, 'error')
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
        evt.$emit('authState', { state: 'signedOut' })
      } catch (err) {
        console.log(err)
        evt.$emit('notify', 'Failed to log out', 'error')
      }
    }
  }
}
</script>

<style>
.logout-active-class::before {
  opacity: 0;
}
</style>
