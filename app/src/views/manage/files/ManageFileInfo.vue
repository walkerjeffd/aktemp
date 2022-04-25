<template>
  <v-container grid-list-xs>
    <v-row v-if="loading">
      <v-col cols="12">
        <div class="body-1">Loading...</div>
      </v-col>
    </v-row>
    <v-row v-else-if="!error" justify="space-around">
      <v-col cols="12">
        id: {{ file && file.id }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'ManageFileInfo',
  data () {
    return {
      loading: true,
      error: null,
      file: null,
      deleter: {
        loading: false,
        error: null
      }
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.file = { id: 1 }
      this.loading = true
      this.error = null
      try {
        this.file = { id: 1 }
        // const response = await this.$http.public.get(`/files/${this.$route.params.fileId}`)
        // this.file = response.data
        // this.loading = false
      } catch (err) {
        console.log(err)
        // this.error = err.message || err.toString()
      }
      this.loading = false
    }
  }
}
</script>

<style>

</style>
