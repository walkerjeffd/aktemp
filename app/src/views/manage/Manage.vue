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
                  :items="organizations"
                  v-model="organization"
                  label="Organization"
                  item-text="code"
                  dense
                  required
                  outlined
                  return-object
                  hide-details
                  :disabled="organizationsStatus.loading"
                  style="z-index:2000"
                ></v-select>
              </div>
            </v-toolbar>

            <v-sheet v-if="organizationsStatus.loading" height="400">
              <Loading class="pt-8"/>
            </v-sheet>
            <v-card-text v-else-if="organizationStatus.error">
              <Alert
                type="error"
                title="Error Loading Organization"
                class="mb-0"
              >
                {{ organizationStatus.error }}
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
      organizations: 'manage/organizations',
      organizationsStatus: 'manage/organizationsStatus',
      organizationStatus: 'manage/organizationStatus'
    }),
    organization: {
      get () {
        return this.$store.state.manage.organization
      },
      set (value) {
        if (this.$route.params.organizationId) {
          this.$router.push({
            name: this.$route.name,
            params: {
              organizationId: value.id
            }
          })
        } else {
          this.$router.push({
            name: 'manageOrganization',
            params: {
              organizationId: value.id
            }
          })
        }
      }
    }
  },
  mounted () {
    this.$store.dispatch('manage/fetchOrganizations')
    this.$store.dispatch('manage/fetchFlagTypes')
  },
  watch: {
    '$route.params.organizationId' (value) {
      if (value) {
        this.setOrganizationFromRoute()
      } else {
        this.routeToOrganization()
      }
    },
    organizations () {
      this.routeToOrganization()
    }
  },
  methods: {
    routeToOrganization () {
      if (this.organizationsStatus.loading || this.organizations.length === 0) return
      if (!this.$route.params.organizationId) {
        const organization = this.organization || this.organizations[0]
        this.$router.push({
          name: 'manageOrganization',
          params: {
            organizationId: organization.id
          }
        })
      } else {
        this.$store.dispatch('manage/setOrganizationById', this.$route.params.organizationId)
      }
    },
    setOrganizationFromRoute () {
      this.$store.dispatch('manage/setOrganizationById', this.$route.params.organizationId)
    }
  }
}
</script>
