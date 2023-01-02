<template>
  <v-main>
    <v-container class="black--text">
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar dense flat color="grey lighten-3" height="60px">
              <v-toolbar-title class="text-h6">
                Manage Data
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <div style="width:300px">
                <v-select
                  :items="providers"
                  v-model="provider"
                  label="Provider"
                  item-text="code"
                  dense
                  required
                  outlined
                  return-object
                  hide-details
                  :disabled="providersStatus.loading"
                  style="z-index:2000"
                ></v-select>
              </div>
            </v-toolbar>

            <v-sheet v-if="providersStatus.loading" height="400">
              <Loading class="pt-8"/>
            </v-sheet>
            <v-card-text v-else-if="providerStatus.error">
              <Alert
                type="error"
                title="Error Loading Provider"
                class="mb-0"
              >
                {{ providerStatus.error }}
              </Alert>
            </v-card-text>
            <v-card-text v-else-if="providers.length === 0">
              <Alert
                type="error"
                title="No Providers Found"
                class="mb-0"
              >
                Your account is not associated with any data providers. Please contact us for assistance.
              </Alert>
            </v-card-text>
            <router-view v-else></router-view>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Manage',
  computed: {
    ...mapGetters({
      providers: 'manage/providers',
      providersStatus: 'manage/providersStatus',
      providerStatus: 'manage/providerStatus'
    }),
    provider: {
      get () {
        return this.$store.state.manage.provider
      },
      set (value) {
        if (this.$route.params.providerId) {
          this.$router.push({
            name: this.$route.name,
            params: {
              providerId: value.id
            }
          })
        } else {
          this.$router.push({
            name: 'manageProvider',
            params: {
              providerId: value.id
            }
          })
        }
      }
    }
  },
  mounted () {
    this.$store.dispatch('manage/fetchProviders')
    this.$store.dispatch('manage/fetchFlagTypes')
  },
  watch: {
    '$route.params.providerId' (value) {
      if (value) {
        this.setProviderFromRoute()
      } else {
        this.routeToProvider()
      }
    },
    providers () {
      this.routeToProvider()
    }
  },
  methods: {
    routeToProvider () {
      if (this.providersStatus.loading || this.providers.length === 0) return
      if (!this.$route.params.providerId) {
        const provider = this.provider || this.providers[0]
        this.$router.push({
          name: 'manageProvider',
          params: {
            providerId: provider.id
          }
        })
      } else {
        this.$store.dispatch('manage/setProviderById', this.$route.params.providerId)
      }
    },
    setProviderFromRoute () {
      this.$store.dispatch('manage/setProviderById', this.$route.params.providerId)
    }
  }
}
</script>
