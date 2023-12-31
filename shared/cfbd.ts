import { Schema, z } from "zod";
import fetch from "node-fetch";
import { readFile, writeFile } from "fs/promises";
import { existsSync as fileExists } from "fs";
import path from "path";
import {
  CfbDGame,
  cfbdGameSchema,
  SeasonType,
  calendarSchema,
  Calendar,
  mediaSchema,
  Media,
  MediaType,
  Team,
  teamSchema,
} from "./schema";

export interface FootballSuccessResult<T> {
  success: true;
  data: T;
}

export interface FootballFailedResult {
  success: false;
  statusCode: number;
  data: undefined | string;
}

const fetchData = async <T>({
  key,
  url,
  schema,
  mappingFunc,
}: {
  key: string;
  url: string;
  schema: Schema<T>;
  mappingFunc?: (data: unknown) => any;
}): Promise<T> => {
  try {
    // if file exists, return it
    const fileName = `${key}.json`;
    if (
      process.env.NODE_ENV === "development" &&
      fileExists(path.join(__dirname, fileName))
    ) {
      var contents = await readFile(path.join(__dirname, fileName), "utf-8");
      return schema.parse(JSON.parse(contents));
    }
    // otherwise, fetch it
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
      },
    });
    if (!response.ok) {
      throw new Error(await response.text().catch(() => response.statusText));
    }
    let jsonData: any = await response.json();
    if (typeof mappingFunc === "function") {
      jsonData = mappingFunc(jsonData);
    }
    const data = schema.parse(jsonData);

    if (process.env.NODE_ENV === "development") {
      await writeFile(path.join(__dirname, fileName), JSON.stringify(data));
    }
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

export const getGames = async (
  year: string,
  week: string,
  seasonType: SeasonType
): Promise<Map<number, CfbDGame>> => {
  const result = await fetchData<CfbDGame[]>({
    url: `https://api.collegefootballdata.com/games?year=${year}&week=${week}&seasonType=${seasonType}`,
    key: `schedule-${year}-${week}-${seasonType}`,
    schema: z.array(cfbdGameSchema),
  });
  //map off of the game id
  const gameMap = new Map<number, CfbDGame>();
  result.forEach((game) => {
    gameMap.set(game.id, game);
  });

  return gameMap;
};

export const getCalendar = (year: string): Promise<Calendar[]> => {
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
): Promise<Media[]> => {
  const result = await fetchData<Media[]>({
    url: `https://api.collegefootballdata.com/games/media?year=${year}&week=${week}&seasonType=${seasonType}&mediaType=${mediaType}`,
    key: `media-${year}-${week}-${seasonType}-${mediaType}`,
    schema: z.array(mediaSchema),
    mappingFunc: (data: any) => {
      return data.map((media) => {
        var startTime = new Date(media.startTime);
        // if the startDate is less than 7 AM eastern time, it's the previous day

        const startDate =
          startTime.getHours() < 7
            ? new Date(startTime.getTime() - 86400000)
            : startTime;
        return {
          ...media,
          startTime: startTime,
          day: startDate.toLocaleDateString("en-US", { weekday: "long" }),
          dow: startDate.getDay(),
          dateOnly: new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          ),
        };
      });
    },
  });
  result.sort((a, b) => {
    if (a.dateOnly.getTime() !== b.dateOnly.getTime()) {
      return a.dateOnly.getTime() - b.dateOnly.getTime();
    }
    const byOutlet = a.outlet.localeCompare(b.outlet);
    if (byOutlet !== 0) {
      return byOutlet;
    }
    return a.startTime.getTime() - b.startTime.getTime();
  });
  return result;
};

export const getTeams = async (): Promise<Map<number, Team>> => {
  const result = await fetchData<Team[]>({
    url: `https://api.collegefootballdata.com/teams`,
    key: `teams`,
    schema: z.array(teamSchema),
  });

  //map off of the team id
  const gameMap = new Map<number, Team>();
  result.forEach((game) => {
    gameMap.set(game.id, game);
  });

  return gameMap;
};
