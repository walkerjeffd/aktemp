<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="ma-4 elevation-2 mb-0">
    <Alert v-if="error" type="error" title="Server Error" class="ma-4 elevation-2">
      {{ error }}
    </Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="requests"
      :loading="loading"
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
          <v-toolbar-title class="text-h6">Account Requests</v-toolbar-title>
          <v-divider inset vertical class="mx-4"></v-divider>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search requests"
            single-line
            hide-details
            clearable
            dense
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-divider inset vertical class="ml-4"></v-divider>
          <RefreshButton :loading="loading" @click="fetch"></RefreshButton>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to approve a request
        </div>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestamp('ff', 'local') }}
      </template>
      <template v-slot:item.pending="{ item }">
        <v-chip v-if="item.pending" small label color="warning">
          Pending
        </v-chip>
      </template>
    </v-data-table>

    <AdminCreateUserDialog ref="createUserDialog"></AdminCreateUserDialog>
  </div>
</template>

<script>
import AdminCreateUserDialog from '@/views/admin/users/AdminCreateUserDialog'

export default {
  name: 'AdminRequests',
  components: { AdminCreateUserDialog },
  data: () => ({
    loading: false,
    error: null,
    search: '',
    sort: {
      by: ['created_at'],
      desc: [true]
    },
    requests: [],
    headers: [
      {
        text: 'ID',
        value: 'id'
      },
      {
        text: 'Submitted',
        value: 'created_at'
      },
      {
        text: 'Name',
        value: 'name'
      },
      {
        text: 'Email',
        value: 'email'
      },
      {
        text: 'Provider',
        value: 'provider_code'
      },
      {
        text: 'Pending',
        value: 'pending'
      }
    ]
  }),
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null
      try {
        this.requests = await this.$http.admin.get('/requests')
          .then(d => d.data)
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    async select (request) {
      const user = await this.$refs.createUserDialog.open(request)
      if (user) {
        try {
          await this.$http.admin.put(`/requests/${request.id}`, {
            pending: false
          })
          this.fetch()
        } catch (err) {
          this.error = this.$errorMessage(err)
        }
      }
    }
  }
}
</script>
