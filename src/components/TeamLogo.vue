<template>
  <div>
    <img :src="logoUrl" />

    {{ team.abbreviation }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Team } from "../../shared/schema";

const { team } = defineProps<{ team: Team; time: string }>();

const logoUrl = computed(() => {
  return team.logos?.[0] || "/img/football-place-holder.png";
});
</script>

<style scoped>
img {
  width: 2rem;
  height: 1.5rem;
}
div {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25px;
  flex-direction: column;
}
p {
  font-size: 0.75rem;
}
</style>
