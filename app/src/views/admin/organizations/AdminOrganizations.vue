<template>
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
      :items="data"
      :loading="loading"
      :sort-by="['updated_at']"
      :sort-desc="[true]"
      loading-text="Loading... Please wait"
      @click:row="select"
      single-select
      class="row-cursor-pointer"
      v-else>
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Organizations</div>
          <v-btn
            color="primary"
            outlined
            @click="fetch"
            class="ml-4"
            small
            rounded
          >
            <v-icon small left v-if="!loading">mdi-refresh</v-icon>
            <v-progress-circular
              indeterminate
              size="14"
              width="2"
              class="mr-2"
              v-else
            ></v-progress-circular>
            Refresh
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create">
            <v-icon left>mdi-plus</v-icon> New Organization
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.created_at="{ item }">
        {{ item.created_at }}
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.id="{ item }">
        {{ item.id.substr(1, 7) }}...
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.is_admin="{ item }">
        <v-icon v-if="item.is_admin" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.enabled="{ item }">
        <v-icon v-if="item.enabled" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.status="{ item }">
        <v-chip
          v-if="item.status==='CONFIRMED'"
          small
          label
          color="gray"
        >
          {{ item.status }}
        </v-chip>
        <v-chip
          v-else
          small
          label
          color="warning"
        >
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>

    <AdminOrganizationCreateDialog ref="createForm"></AdminOrganizationCreateDialog>
    <AdminOrganizationEditDialog ref="editForm"></AdminOrganizationEditDialog>
  </div>
</template>

<script>
import AdminOrganizationCreateDialog from '@/views/admin/organizations/AdminOrganizationCreateDialog'
import AdminOrganizationEditDialog from '@/views/admin/organizations/AdminOrganizationEditDialog'

export default {
  name: 'AdminOrganizations',
  components: {
    AdminOrganizationCreateDialog,
    AdminOrganizationEditDialog
  },
  data: () => ({
    loading: false,
    error: null,
    data: [],
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
        const response = await this.$http.admin.get('/organizations')
        const data = response.data
        data.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
        })
        this.data = data
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
    },
    async select (item, row) {
      const saved = await this.$refs.editForm.open(item.id)
      if (saved) {
        return await this.fetch()
      }
    },
    async create () {
      const itemCreated = await this.$refs.createForm.open()
      if (itemCreated) {
        await this.fetch()
      }
    }
  }
}
</script>
