<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert v-if="status.error" type="error" title="Server Error" class="ma-4 elevation-2">
      {{status.error}}
    </Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="providers"
      :loading="status.loading"
      :sort-by.sync="sort.by"
      :sort-desc.sync="sort.desc"
      :search="search"
      loading-text="Loading... Please wait"
      single-select
      class="row-cursor-pointer"
      @click:row="select"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="text-h6">Providers</v-toolbar-title>
          <v-divider inset vertical class="mx-4"></v-divider>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search providers"
            single-line
            hide-details
            clearable
            dense
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create">
            <v-icon left>mdi-plus</v-icon> New Provider
          </v-btn>
          <v-divider inset vertical class="ml-4"></v-divider>
          <RefreshButton :loading="status.loading" @click="fetchProviders"></RefreshButton>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to edit an provider
        </div>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestamp('ff', 'local') }}
      </template>
      <template v-slot:item.users_count="{ item }">
        {{ item.users.length }}
      </template>
    </v-data-table>

    <AdminProviderDialog ref="providerDialog"></AdminProviderDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AdminProviderDialog from '@/views/admin/providers/AdminProviderDialog'

export default {
  name: 'AdminProviders',
  components: {
    AdminProviderDialog
  },
  data: () => ({
    search: '',
    sort: {
      by: ['code'],
      desc: [false]
    },
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
      providers: 'admin/providers',
      status: 'admin/providersStatus'
    })
  },
  mounted () {
    this.fetchProviders()
  },
  methods: {
    ...mapActions({
      fetchOrganizations: 'admin/fetchOrganizations',
      fetchProviders: 'admin/fetchProviders'
    }),
    async select (row) {
      const provider = await this.$refs.providerDialog.open(row)
      if (provider) {
        await this.fetchOrganizations()
        return await this.fetchProviders()
      }
    },
    async create () {
      const provider = await this.$refs.providerDialog.open()
      if (provider) {
        await this.fetchOrganizations()
        return await this.fetchProviders()
      }
    }
  }
}
</script>
