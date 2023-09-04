import { Schema, z } from "zod";
import fetch from "node-fetch";
import { readFile, writeFile } from "fs/promises";
import { existsSync as fileExists } from "fs";
import path from "path";
import {
  Game,
  gameSchema,
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
    let jsonData: any = await response.json();
    if (typeof mappingFunc === "function") {
      jsonData = mappingFunc(jsonData);
    }
    const data = schema.parse(jsonData);

    if (process.env.NODE_ENV === "development") {
      await writeFile(path.join(__dirname, fileName), JSON.stringify(data));
    }
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      // make error not unknown
      success: false,
      statusCode: 500,
      data: JSON.stringify(error.toString()),
    };
  }
};

export const getGames = async (
  year: string,
  week: string,
  seasonType: SeasonType
): Promise<FootballFailedResult | FootballSuccessResult<Map<number, Game>>> => {
  const result = await fetchData<Game[]>({
    url: `https://api.collegefootballdata.com/games?year=${year}&week=${week}&seasonType=${seasonType}`,
    key: `schedule-${year}-${week}-${seasonType}`,
    schema: z.array(gameSchema),
    mappingFunc: (data: any) => {
      return data.map((game) => {
        return {
          ...game,
          start_date: new Date(game.start_date),
        };
      });
    },
  });

  if (!result.success) {
    return result;
  }

  //map off of the game id
  const gameMap = new Map<number, Game>();
  result.data.forEach((game) => {
    gameMap.set(game.id, game);
  });

  return {
    ...result,
    data: gameMap,
  };
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
): Promise<FootballFailedResult | FootballSuccessResult<Media[]>> => {
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
  if (result.success) {
    //first sort the media by start time and outlet
    result.data.sort((a, b) => {
      if (a.dateOnly.getTime() !== b.dateOnly.getTime()) {
        return a.dateOnly.getTime() - b.dateOnly.getTime();
      }
      return a.outlet.localeCompare(b.outlet);
    });
  }
  return result;
};

export const getTeams = async (): Promise<
  FootballFailedResult | FootballSuccessResult<Map<number, Team>>
> => {
  const result = await fetchData<Team[]>({
    url: `https://api.collegefootballdata.com/teams`,
    key: `teams`,
    schema: z.array(teamSchema),
  });

  if (!result.success) {
    return result;
  }

  //map off of the team id
  const gameMap = new Map<number, Team>();
  result.data.forEach((game) => {
    gameMap.set(game.id, game);
  });

  return {
    ...result,
    data: gameMap,
  };
};
