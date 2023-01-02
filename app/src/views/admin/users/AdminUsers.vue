<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div class="ma-4 elevation-2 mb-0">
    <Alert v-if="status.error" type="error" title="Server Error" class="ma-4 elevation-2">
      {{ status.error }}
    </Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="users"
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
          <v-toolbar-title class="text-h6">Users</v-toolbar-title>
          <v-divider inset vertical class="mx-4"></v-divider>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search users"
            single-line
            hide-details
            clearable
            dense
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="create">
            <v-icon left>mdi-plus</v-icon> New User
          </v-btn>
          <v-divider inset vertical class="ml-4"></v-divider>
          <RefreshButton :loading="status.loading" @click="fetchUsers"></RefreshButton>
        </v-toolbar>
        <div class="body-2 text--secondary mx-4 mb-2">
          <v-icon small>mdi-information-outline</v-icon>
          Click on a row to edit a user
        </div>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestamp('ff', 'local') }}
      </template>
      <template v-slot:item.id="{ item }">
        {{ item.id | truncate(5) }}
      </template>
      <template v-slot:item.admin="{ item }">
        <Checkbox :value="item.admin"></Checkbox>
      </template>
      <template v-slot:item.enabled="{ item }">
        <Checkbox :value="item.enabled"></Checkbox>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip small label
          :color="item.status==='CONFIRMED' ? 'gray' : 'warning'"
        >
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>

    <AdminCreateUserDialog ref="createUserDialog"></AdminCreateUserDialog>
    <AdminEditUserDialog ref="editUserDialog"></AdminEditUserDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import AdminCreateUserDialog from '@/views/admin/users/AdminCreateUserDialog'
import AdminEditUserDialog from '@/views/admin/users/AdminEditUserDialog'

export default {
  name: 'AdminUsers',
  components: {
    AdminCreateUserDialog,
    AdminEditUserDialog
  },
  data: () => ({
    search: '',
    sort: {
      by: ['created_at'],
      desc: [true]
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
        text: 'Name',
        value: 'attributes.name'
      },
      {
        text: 'Email',
        value: 'attributes.email'
      },
      {
        text: 'Admin',
        value: 'admin'
      },
      {
        text: 'Enabled',
        value: 'enabled'
      },
      {
        text: 'Status',
        value: 'status'
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
      const saved = await this.$refs.editUserDialog.open(user.id)
      if (saved) {
        return await this.fetchUsers()
      }
    },
    async create () {
      const user = await this.$refs.createUserDialog.open()
      if (user) {
        await this.fetchUsers()
      }
    }
  }
}
</script>
