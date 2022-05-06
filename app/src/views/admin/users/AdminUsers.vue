<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Error Occurred" v-if="status.error" class="ma-4">{{ status.error }}</Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="users"
      :loading="status.loading"
      :sort-by="['attributes.name']"
      loading-text="Loading... Please wait"
      @click:row="select"
      single-select
      class="row-cursor-pointer"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Users</div>
          <RefreshButton :loading="status.loading" @click="fetchUsers"></RefreshButton>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="createUser">
            <v-icon left>mdi-plus</v-icon> New User
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestampFormat('lll') }}
      </template>
      <template v-slot:item.id="{ item }">
        {{ item.id.substr(1, 7) }}...
      </template>
      <template v-slot:item.admin="{ item }">
        <v-icon v-if="item.admin" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-icon v-if="item.enabled" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
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

    <AdminUserCreateDialog ref="createUserForm"></AdminUserCreateDialog>
    <AdminUserEditDialog ref="editUserForm"></AdminUserEditDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AdminUserCreateDialog from '@/views/admin/users/AdminUserCreateDialog'
import AdminUserEditDialog from '@/views/admin/users/AdminUserEditDialog'

export default {
  name: 'AdminUsers',
  components: {
    AdminUserCreateDialog,
    AdminUserEditDialog
  },
  data: () => ({
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
        value: 'attributes.name',
        align: 'left'
      },
      {
        text: 'Email',
        value: 'attributes.email',
        align: 'left'
      },
      {
        text: 'Admin',
        value: 'admin',
        align: 'left'
      },
      {
        text: 'Enabled',
        value: 'enabled',
        align: 'left'
      },
      {
        text: 'Status',
        value: 'status',
        align: 'left'
      }
    ]
  }),
  computed: {
    ...mapGetters({
      users: 'admin/users',
      status: 'admin/usersStatus'
    })
  },
  mounted () {
    this.fetchUsers()
  },
  methods: {
    ...mapActions({ fetchUsers: 'admin/fetchUsers' }),
    async select (user, row) {
      const saved = await this.$refs.editUserForm.open(user.id)
      if (saved) {
        return await this.fetchUsers()
      }
    },
    async createUser () {
      const created = await this.$refs.createUserForm.open()
      if (created) {
        await this.fetchUsers()
      }
    }
  }
}
</script>
