import { Handler } from "@netlify/functions";
import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { existsSync as fileExists } from "fs";
import path from "path";
import fetch from "node-fetch";

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

interface FootballSuccessResult<T> {
  success: true;
  data: T;
}

interface FootballFailedResult {
  success: false;
  statusCode: number;
  data: undefined | string;
}

type Schedule = z.infer<typeof scheduleSchema>;
type Team = z.infer<typeof teamSchema>;

export const handler: Handler = async (event, context) => {
  const { week = "1", season } = event.queryStringParameters || {};
  var year = season || new Date().getFullYear();
  const fileName = `schedule-${year}-${week}.json`;

  if (
    process.env.NODE_ENV === "development" &&
    fileExists(path.join(__dirname, fileName))
  ) {
    var contents = await readFile(path.join(__dirname, fileName), "utf-8");
    return {
      statusCode: 200,
      body: contents,
    };
  }

  const [scheduleResult, teamResult] = await Promise.all([
    getSchedule(year, week),
    getTeams(),
  ]);

  if (!scheduleResult.success) {
    return {
      statusCode: scheduleResult.statusCode,
      body: JSON.stringify(scheduleResult.data),
    };
  }

  if (!teamResult.success) {
    return {
      statusCode: teamResult.statusCode,
      body: JSON.stringify(teamResult.data),
    };
  }

  const schedule = getMappedSchedule(scheduleResult.data, teamResult.data);

  const body = JSON.stringify({
    schedule: schedule,
  });

  if (process.env.NODE_ENV === "development") {
    //save to schedule.json
    await writeFile(path.join(__dirname, fileName), body);
  }

  return {
    statusCode: 200,
    body: body,
  };
};

const getSchedule = async (
  year: number,
  week: string
): Promise<FootballFailedResult | FootballSuccessResult<Schedule[]>> => {
  const url = `https://api.collegefootballdata.com/games?year=${year}&week=${week}&seasonType=regular`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
      },
    });
    console.log({ response, ok: response.ok });
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        data: await response.text().catch(() => response.statusText),
      };
    }
    return {
      success: true,
      data: z.array(scheduleSchema).parse(await response.json()),
    };
  } catch (error) {
    console.log({ error });
    return {
      success: false,
      statusCode: 500,
      data: JSON.stringify(error.toString()),
    };
  }
};

const getTeams = async (): Promise<
  FootballFailedResult | FootballSuccessResult<Record<number, Team>>
> => {
  const url = `https://api.collegefootballdata.com/teams`;

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

  const teams = z.array(teamSchema).parse(await response.json());

  const teamMap = teams.reduce((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {} as Record<number, Team>);

  return {
    success: true,
    data: teamMap,
  };
};

const getMappedSchedule = (
  schedule: Schedule[],
  teams: Record<number, Team>
) => {
  return schedule.map((game) => ({
    ...game,
    home_team: teams[game.home_id],
    away_team: teams[game.away_id],
  }));
};
