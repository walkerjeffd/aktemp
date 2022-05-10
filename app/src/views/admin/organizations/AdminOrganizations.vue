<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Error Occurred" v-if="status.error" class="ma-4">{{status.error}}</Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="organizations"
      :loading="status.loading"
      :sort-by="['code']"
      loading-text="Loading... Please wait"
      @click:row="select"
      single-select
      class="row-cursor-pointer"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Organizations</div>
          <RefreshButton :loading="status.loading" @click="fetchOrganizations"></RefreshButton>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create">
            <v-icon left>mdi-plus</v-icon> New Organization
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.code="{ item }">
        {{ item.code | truncate(10) }}
      </template>
      <template v-slot:item.name="{ item }">
        {{ item.name | truncate(40) }}
      </template>
      <template v-slot:item.updated_at="{ item }">
        {{ item.updated_at | timestampFormat('lll') }}
      </template>
    </v-data-table>

    <AdminOrganizationCreateDialog ref="createForm"></AdminOrganizationCreateDialog>
    <AdminOrganizationEditDialog ref="editForm"></AdminOrganizationEditDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AdminOrganizationEditDialog from '@/views/admin/organizations/AdminOrganizationEditDialog'
import AdminOrganizationCreateDialog from '@/views/admin/organizations/AdminOrganizationCreateDialog'

export default {
  name: 'AdminOrganizations',
  components: {
    AdminOrganizationCreateDialog,
    AdminOrganizationEditDialog
  },
  data: () => ({
    headers: [
      {
        text: 'ID',
        value: 'id',
        align: 'right',
        width: '100px'
      },
      {
        text: 'Code',
        value: 'code',
        align: 'right',
        width: '150px'
      },
      {
        text: 'Name',
        value: 'name',
        align: 'left'
      },
      {
        text: 'Last Updated',
        value: 'updated_at',
        align: 'left',
        width: '300px'
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
    async select (item) {
      const saved = await this.$refs.editForm.open(item.id)
      if (saved) {
        return await this.fetchOrganizations()
      }
    },
    async create () {
      const created = await this.$refs.createForm.open()
      if (created) {
        await this.fetchOrganizations()
      }
    }
  }
}
</script>
