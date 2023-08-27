import { Schema, z } from "zod";
import fetch from "node-fetch";
import { readFile, writeFile } from "fs/promises";
import { existsSync as fileExists } from "fs";
import path from "path";

const scheduleSchema = z.object({
  id: z.number(),
  season: z.number(),
  week: z.number(),
  season_type: z.string(),
  start_date: z.string(),
  start_time_tbd: z.boolean(),
  completed: z.boolean(),
  home_id: z.number(),
  home_team: z.string(),
  home_points: z.number().nullable(),
  away_id: z.number(),
  away_team: z.string(),
  away_points: z.number().nullable(),
});

const teamSchema = z.object({
  id: z.number(),
  school: z.string(),
  mascot: z.string().nullable(),
  abbreviation: z.string().nullable(),
  conference: z.string().nullable(),
  color: z.string().nullable(),
  alt_color: z.string().nullable(),
  logos: z.array(z.string()).nullable(),
});

const calendarSchema = z.object({
  season: z.string(),
  week: z.number(),
  seasonType: z.string(),
  firstGameStart: z.string(),
  lastGameStart: z.string(),
});

const mediaSchema = z.object({
  id: z.number(),
  season: z.number(),
  week: z.number(),
  seasonType: z.string(),
  startTime: z.string(),
  isStartTimeTBD: z.boolean(),
  homeTeam: z.string(),
  homeConference: z.string(),
  awayTeam: z.string(),
  awayConference: z.string(),
  mediaType: z.string(),
  outlet: z.string(),
});

export const seasonTypeSchema = z.enum(["regular", "postseason"]);
export const mediaTypeSchema = z.enum(["tv", "web", "radio", "ppv", "mobile"]);

export interface FootballSuccessResult<T> {
  success: true;
  data: T;
}

export interface FootballFailedResult {
  success: false;
  statusCode: number;
  data: undefined | string;
}

export type Schedule = z.infer<typeof scheduleSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Calendar = z.infer<typeof calendarSchema>;
export type SeasonType = z.infer<typeof seasonTypeSchema>;
export type MediaType = z.infer<typeof mediaTypeSchema>;
export type Media = z.infer<typeof mediaSchema>;

const fetchData = async <T>({
  key,
  url,
  schema,
}: {
  key: string;
  url: string;
  schema: Schema<T>;
}): Promise<FootballFailedResult | FootballSuccessResult<T>> => {
  try {
    // if file exists, return it
    const fileName = `${key}.json`;
    if (
      process.env.NODE_ENV === "development" &&
      fileExists(path.join(__dirname, fileName))
    ) {
      var contents = await readFile(path.join(__dirname, fileName), "utf-8");
      return {
        success: true,
        data: schema.parse(JSON.parse(contents)),
      };
    }
    // otherwise, fetch it
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
      },
    });
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        data: await response.text().catch(() => response.statusText),
      };
    }
    const data = schema.parse(await response.json());

    if (process.env.NODE_ENV === "development") {
      await writeFile(path.join(__dirname, fileName), JSON.stringify(data));
    }
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      data: JSON.stringify(error.toString()),
    };
  }
};

export const getGames = (
  year: string,
  week: string,
  seasonType: SeasonType
): Promise<FootballFailedResult | FootballSuccessResult<Schedule[]>> => {
  return fetchData<Schedule[]>({
    url: `https://api.collegefootballdata.com/games?year=${year}&week=${week}&seasonType=${seasonType}`,
    key: `schedule-${year}-${week}-${seasonType}`,
    schema: z.array(scheduleSchema),
  });
};

export const getCalendar = (
  year: string
): Promise<FootballFailedResult | FootballSuccessResult<Calendar[]>> => {
  return fetchData<Calendar[]>({
    url: `https://api.collegefootballdata.com/calendar?year=${year}`,
    key: `calendar-${year}`,
    schema: z.array(calendarSchema),
  });
};

export const getMedia = async (
  year: string,
  week: string,
  seasonType: SeasonType,
  mediaType: MediaType
): Promise<
  FootballFailedResult | FootballSuccessResult<Record<number, Media>>
> => {
  const result = await fetchData<Media[]>({
    url: `https://api.collegefootballdata.com/games/media?year=${year}&week=${week}&seasonType=${seasonType}&mediaType=${mediaType}`,
    key: `media-${year}-${week}-${seasonType}-${mediaType}`,
    schema: z.array(mediaSchema),
  });

  if (!result.success) {
    return result;
  }

  const mediaMap = result.data.reduce((acc, media) => {
    acc[media.id] = media;
    return acc;
  }, {} as Record<number, Media>);

  return {
    ...result,
    data: mediaMap,
  };
};

export const getTeams = async (): Promise<
  FootballFailedResult | FootballSuccessResult<Record<number, Team>>
> => {
  const result = await fetchData<Team[]>({
    url: `https://api.collegefootballdata.com/teams`,
    key: `teams`,
    schema: z.array(teamSchema),
  });

  if (!result.success) {
    return result;
  }

  const teamMap = result.data.reduce((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {} as Record<number, Team>);

  return {
    ...result,
    data: teamMap,
  };
};
