import { z } from "zod";
import { calendarSchema, scheduleSchema } from "../../shared/schema";
import { MediaType, SeasonType } from "../../shared/schema";

export type ScheduleQuery = {
  season: string;
  week: string;
  seasonType: SeasonType;
  mediaType: MediaType;
};

const fetchJson = (url: string) => {
  return fetch(`${import.meta.env.VITE_APP_API_URL || null}${url}`).then(
    (res) => res.json()
  );
};
export const fetchCalendar = (season: string) => {
  return fetchJson(`/.netlify/functions/get-calendar?season=${season}`).then(
    (data) => {
      return z.array(calendarSchema).parse(data);
    }
  );
};

export const fetchSchedule = ({
  season,
  week,
  seasonType,
  mediaType,
}: ScheduleQuery) => {
  return fetchJson(
    `/.netlify/functions/get-schedule?season=${season}&week=${week}&seasonType=${seasonType}&mediaType=${mediaType}`
  ).then((data) => z.array(scheduleSchema).parse(data));
};
