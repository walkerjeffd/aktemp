<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert v-if="status.error" type="error" title="Server Error" class="ma-4 elevation-2">
      {{status.error}}
    </Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="organizations"
      :loading="status.loading"
      :sort-by="['code']"
      :search="search"
      loading-text="Loading... Please wait"
      single-select
      class="row-cursor-pointer"
      @click:row="select"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h6">Organizations</div>
          <RefreshButton :loading="status.loading" @click="fetchOrganizations"></RefreshButton>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create">
            <v-icon left>mdi-plus</v-icon> New Organization
          </v-btn>
        </v-toolbar>
        <v-row class="justify-space-between align-end px-4 mb-2">
          <v-col cols="12" lg="4" xl="3">
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search organizations"
              single-line
              hide-details
              clearable
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" lg="4" xl="3" class="body-2 text--secondary text-right">
            <v-icon small>mdi-information-outline</v-icon>
            Click on a row to edit an organization
          </v-col>
        </v-row>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestampFormat('ll') }}
      </template>
      <template v-slot:item.users_count="{ item }">
        {{ item.users.length }}
      </template>
    </v-data-table>

    <AdminOrganizationDialog ref="organizationDialog"></AdminOrganizationDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AdminOrganizationDialog from '@/views/admin/organizations/AdminOrganizationDialog'

export default {
  name: 'AdminOrganizations',
  components: {
    AdminOrganizationDialog
  },
  data: () => ({
    search: '',
    headers: [
      {
        text: 'ID',
        value: 'id'
      },
      {
        text: 'Created',
        value: 'created_at'
      },
      {
        text: 'Code',
        value: 'code'
      },
      {
        text: 'Name',
        value: 'name'
      },
      {
        text: 'POC Name',
        value: 'poc_name'
      },
      {
        text: 'POC Email',
        value: 'poc_email'
      },
      {
        text: '# Users',
        value: 'users_count'
      }
    ]
  }),
  computed: {
    ...mapGetters({
      organizations: 'admin/organizations',
      status: 'admin/organizationsStatus'
    })
  },
  mounted () {
    this.fetchOrganizations()
  },
  methods: {
    ...mapActions({ fetchOrganizations: 'admin/fetchOrganizations' }),
    async select (row) {
      const organization = await this.$refs.organizationDialog.open(row)
      if (organization) {
        return await this.fetchOrganizations()
      }
    },
    async create () {
      const organization = await this.$refs.organizationDialog.open()
      if (organization) {
        await this.fetchOrganizations()
      }
    }
  }
}
</script>
