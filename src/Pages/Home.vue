<template>
  <div class="header" v-if="calendar">
    <h3>{{ currentWeek?.season }} Week {{ currentWeek?.week }}</h3>
    <ScheduleLayout v-if="schedule" :schedule="schedule" />
  </div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import ScheduleLayout from "../components/ScheduleLayout.vue";
import { computed, onMounted, ref, watch } from "vue";
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

const currentWeek = computed(() => {
  if (!calendar.value) {
    return null;
  }
  return calendar.value.find(
    (c) =>
      c.week === parseInt(route.query.week?.toString() || "1") &&
      c.season === route.query.season
  );
});

const fetchCalendarData = async (query: ScheduleQuery) => {
  try {
    const [cal, sch] = await Promise.all([
      fetchCalendar(query.season),
      fetchSchedule(query),
    ]);
    console.log({ cal, sch });
    schedule.value = sch;
    calendar.value = cal;
  } catch (e) {
    console.log(e);
  }
};

const createScheduleQuery = (query: any): ScheduleQuery => {
  if (!query) {
    return {
      season: new Date().getFullYear().toString(),
      week: "1",
      seasonType: "regular",
      mediaType: "tv",
    };
  }
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
    try {
      await fetchCalendarData(createScheduleQuery(q));
    } catch (e) {
      console.log(e);
    }
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  width: 100%;
  margin: auto;
  padding: 30px 0;
}
</style>
