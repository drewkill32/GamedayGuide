<template>
  <Header />
  <main>
    <slot />
  </main>
  <Footer />
</template>

<script setup lang="ts">
import Header from "./Header.vue";
import Footer from "./Footer.vue";
</script>

<style scoped></style>
