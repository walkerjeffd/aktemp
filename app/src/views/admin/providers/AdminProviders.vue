<template>
  <div>
    <AdminOrganizationsTable class="mx-4 pt-1 elevation-2" />
    <v-divider class="my-4"></v-divider>
    <AdminProvidersTable class="mx-4 elevation-2" />
  </div>
</template>

<script>
import AdminProvidersTable from '@/views/admin/providers/AdminProvidersTable'
import AdminOrganizationsTable from '@/views/admin/providers/AdminOrganizationsTable'
export default {
  name: 'AdminProviders',
  components: {
    AdminOrganizationsTable,
    AdminProvidersTable
  }
}
</script>
