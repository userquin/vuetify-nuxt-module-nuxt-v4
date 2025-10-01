<script setup lang="ts">
const { t, current } = useLocale()
</script>

<template>
  <v-btn>{{ t('$vuetify.badge') }} - {{ current }}</v-btn>
</template>
