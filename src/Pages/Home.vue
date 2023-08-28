<template>
  <div class="header" v-if="calendar">
    <h3>{{ calendar[0].season }} Week {{ calendar[0].week }}</h3>
  </div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Calendar,
  Schedule,
  mediaTypeSchema,
  seasonTypeSchema,
} from "../../shared/schema";
import { fetchCalendar, fetchSchedule, ScheduleQuery } from "../api";

const route = useRoute();
const router = useRouter();
const calendar = ref<Calendar[] | null>(null);
const schedule = ref<Schedule[] | null>(null);

const fetchCalendarData = async (query: ScheduleQuery) => {
  const cal = await fetchCalendar(query.season);

  schedule.value = await fetchSchedule(query);
  calendar.value = cal;
};

const createScheduleQuery = (query: any): ScheduleQuery => {
  const type = query.seasonType
    ? seasonTypeSchema.parse(query.seasonType.toString())
    : "regular";
  const media = query.mediaType ? mediaTypeSchema.parse(query.mediaType) : "tv";
  return {
    season: query?.season || new Date().getFullYear().toString(),
    week: query?.week || "1",
    seasonType: type,
    mediaType: media,
  };
};

watch(
  () => route.query,
  async (q) => {
    await fetchCalendarData(createScheduleQuery(q));
  }
);

onMounted(() => {
  const scheduleQuery = createScheduleQuery(route.query);
  if (
    !route.query.season ||
    !route.query.week ||
    !route.query.seasonType ||
    !route.query.mediaType
  ) {
    router.push({
      query: scheduleQuery,
    });
    return;
  }
  return fetchCalendarData(scheduleQuery);
});
</script>

<style scoped>
.header {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  width: 100%;
  margin: auto;
  padding: 30px 0;
}
</style>
