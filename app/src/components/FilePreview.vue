<template>
  <div style="overflow:auto;max-height:400px;border:1px solid rgba(0, 0, 0, 0.12)">
    <table class="text-monospace">
      <tbody>
        <tr v-for="(line, i) in lines" :key="`line-${i}`" :class="{'file-preview-skip': i < skipLines, 'file-preview-head': i === skipLines}">
          <td class="px-2 text-right" style="border-right:1px solid rgba(0, 0, 0, 0.12)">
            <span v-if="i < skipLines">Skip</span>
            <span v-else-if="i === skipLines">Names</span>
            <span v-else>{{i - skipLines}}</span>
          </td>
          <td style="white-space:nowrap">{{ line }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'FilePreview',
  props: {
    lines: {
      type: Array
    },
    skipLines: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style>
.file-preview-skip {
  color: #AAAAAA;
}
.file-preview-head {
  font-weight: bold;
  background-color: rgb(0, 0, 0, 0.1);
}
</style>
