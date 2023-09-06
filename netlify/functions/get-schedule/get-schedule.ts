import { Handler } from "@netlify/functions";
import {
  Game,
  Team,
  mediaTypeSchema,
  seasonTypeSchema,
  Media,
  Schedule,
  CfbDGame,
} from "../../../shared/schema";

import { getMedia, getGames, getTeams } from "../../../shared/cfbd";
import { getHeaders } from "../../../shared/utils";

export const handler: Handler = async (event) => {
  const {
    week = "1",
    season,
    seasonType = "regular",
    mediaType = "tv",
  } = event.queryStringParameters || {};
  const year = season || new Date().getFullYear().toString();
  const headers = getHeaders();

  const type = seasonTypeSchema.parse(seasonType);
  const [games, teams, media] = await Promise.all([
    getGames(year, week, type),
    getTeams(),
    getMedia(year, week, type, mediaTypeSchema.parse(mediaType)),
  ]);

  const schedule = createSchedule(games, teams, media);

  const body = JSON.stringify(schedule);

  return {
    statusCode: 200,
    body: body,
    headers,
  };
};

const createSchedule = (
  games: Map<number, CfbDGame>,
  teams: Map<number, Team>,
  media: Media[]
): Schedule[] => {
  const schedule: Schedule[] = [];
  let currentDate: Date = new Date("1/1/1970");
  let currentOutlet: string | null = null;
  let currentSchedule: Schedule | null = null;

  media.forEach((media) => {
    const game = games.get(media.id)!;
    const homeTeam = teams.get(game.home_id)!;
    const awayTeam = teams.get(game.away_id)!;

    if (media.dateOnly.getTime() !== currentDate.getTime()) {
      currentSchedule = {
        date: media.dateOnly,
        dow: media.dow,
        day: media.day,
        firstGameStart: media.startTime,
        lastGameStart: media.startTime,
        outlets: [],
      };
      schedule.push(currentSchedule);
      currentDate = media.dateOnly;
      currentOutlet = null;
    }

    if (media.outlet !== currentOutlet) {
      currentSchedule!.outlets.push({
        name: media.outlet,
        mediaType: media.mediaType,
        games: [],
      });
      currentOutlet = media.outlet;
    }

    const currentOutletGames =
      currentSchedule!.outlets[currentSchedule!.outlets.length - 1].games;
    currentOutletGames.push({
      id: game.id,
      season: game.season,
      awayPoints: game.away_points,
      awayTeam: awayTeam,
      completed: game.completed,
      homePoints: game.home_points,
      homeTeam: homeTeam,
      seasonType: game.season_type,
      startTime: game.start_date,
      startTimeTbd: game.start_time_tbd,
      week: game.week,
    });

    if (media.startTime < currentSchedule!.firstGameStart) {
      currentSchedule!.firstGameStart = media.startTime;
    }
    if (media.startTime > currentSchedule!.lastGameStart) {
      currentSchedule!.lastGameStart = media.startTime;
    }
  });

  return schedule;
};
