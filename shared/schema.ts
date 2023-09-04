import { z } from "zod";

export const gameSchema = z.object({
  id: z.number(),
  season: z.number(),
  week: z.number(),
  season_type: z.string(),
  start_date: z.date(),
  start_time_tbd: z.boolean(),
  completed: z.boolean(),
  home_id: z.number(),
  home_team: z.string(),
  home_points: z.number().nullable(),
  away_id: z.number(),
  away_team: z.string(),
  away_points: z.number().nullable(),
});

export const teamSchema = z.object({
  id: z.number(),
  school: z.string(),
  mascot: z.string().nullable(),
  abbreviation: z.string().nullable(),
  conference: z.string().nullable(),
  color: z.string().nullable(),
  alt_color: z.string().nullable(),
  logos: z.array(z.string()).nullable(),
});

export const calendarSchema = z.object({
  season: z.string(),
  week: z.number(),
  seasonType: z.string(),
  firstGameStart: z.string(),
  lastGameStart: z.string(),
});

export const mediaSchema = z.object({
  id: z.number(),
  season: z.number(),
  week: z.number(),
  seasonType: z.string(),
  startTime: z.date(),
  dow: z.number(),
  dateOnly: z.date(),
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  isStartTimeTBD: z.boolean(),
  homeTeam: z.string(),
  homeConference: z.string(),
  awayTeam: z.string(),
  awayConference: z.string(),
  mediaType: z.string(),
  outlet: z.string(),
});

export const scheduleSchema = z.object({
  dow: z.number(),
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  date: z.date(),
  firstGameStart: z.date(),
  lastGameStart: z.date(),
  outlets: z.array(
    z.object({
      name: z.string(),
      mediaType: z.string(),
      games: z.array(
        z.object({
          id: z.number(),
          season: z.number(),
          week: z.number(),
          seasonType: z.string(),
          startTime: z.date(),
          startTimeTbd: z.boolean(),
          completed: z.boolean(),
          homeTeam: teamSchema,
          awayTeam: teamSchema,
          homePoints: z.number().nullable(),
          awayPoints: z.number().nullable(),
        })
      ),
    })
  ),
});

export const seasonTypeSchema = z.enum(["regular", "postseason"]);
export const mediaTypeSchema = z.enum(["tv", "web", "radio", "ppv", "mobile"]);

export type Game = z.infer<typeof gameSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Calendar = z.infer<typeof calendarSchema>;
export type SeasonType = z.infer<typeof seasonTypeSchema>;
export type MediaType = z.infer<typeof mediaTypeSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
