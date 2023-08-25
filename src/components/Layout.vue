<script setup lang="ts">
import Header from "./Header.vue";
import Footer from "./Footer.vue";
</script>

<template>
  <Header />
  <main class="content">
    <slot />
  </main>
  <Footer />
</template>

<style scoped>
.content {
  min-height: calc(100vh - 8rem);
}
</style>
