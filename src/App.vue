<template>
  <Layout>
    <router-view />
  </Layout>
</template>

<script setup lang="ts">
import Layout from "./components/Layout.vue";
</script>

<style scoped>
.fallback {
  height: 100vh;
  width: 100vw;
  background-color: #aa1c1c;
}
</style>
