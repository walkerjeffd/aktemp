<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <v-alert
      type="error"
      text
      colored-border
      border="left"
      class="body-2 mb-0"
      v-if="error"
    >
      <div class="body-1 font-weight-bold">Error Occurred</div>
      <div>{{ error }}</div>
    </v-alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="accounts"
      :loading="loading"
      :sort-by="['created_at']"
      :sort-desc="[true]"
      loading-text="Loading... Please wait"
      single-select
      class="row-cursor-pointer"
      v-else>
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Account Requests</div>
          <RefreshButton :loading="loading" @click="fetch"></RefreshButton>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestampFormat('lll') }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: 'AccountRequests',
  data: () => ({
    loading: false,
    error: null,
    accounts: [],
    headers: [
      {
        text: 'ID',
        value: 'id',
        align: 'left'
      },
      {
        text: 'Created',
        value: 'created_at',
        align: 'left'
      },
      {
        text: 'Name',
        value: 'name',
        align: 'left'
      },
      {
        text: 'Email',
        value: 'email',
        align: 'left'
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
        const response = await this.$http.admin.get('/requests')
        const accounts = response.data
        this.accounts = accounts
      } catch (err) {
        console.error(err)
        if (err.response && err.response.data) {
          this.error = err.response.data.message || err.toString()
        } else {
          this.error = err.message || err.toString()
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
