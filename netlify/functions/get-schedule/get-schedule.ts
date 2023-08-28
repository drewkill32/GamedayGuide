import { Handler } from "@netlify/functions";
import {
  Game,
  Team,
  mediaTypeSchema,
  seasonTypeSchema,
  Media,
  Schedule,
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
  const [gameResult, teamResult, mediaResult] = await Promise.all([
    getGames(year, week, type),
    getTeams(),
    getMedia(year, week, type, mediaTypeSchema.parse(mediaType)),
  ]);

  if (!gameResult.success) {
    return {
      statusCode: gameResult.statusCode,
      body: JSON.stringify(gameResult.data),
      headers,
    };
  }

  if (!teamResult.success) {
    return {
      statusCode: teamResult.statusCode,
      body: JSON.stringify(teamResult.data),
      headers,
    };
  }

  if (!mediaResult.success) {
    return {
      statusCode: mediaResult.statusCode,
      body: JSON.stringify(mediaResult.data),
      headers,
    };
  }

  const schedule = createSchedule(
    gameResult.data,
    teamResult.data,
    mediaResult.data
  );

  const body = JSON.stringify(schedule);

  return {
    statusCode: 200,
    body: body,
    headers,
  };
};

const createSchedule = (
  schedule: Game[],
  teams: Record<number, Team>,
  media: Record<number, Media>
): Schedule[] => {
  return schedule
    .map((game) => ({
      ...game,
      home_team: teams[game.home_id],
      away_team: teams[game.away_id],
      media: media[game.id] || null,
    }))
    .filter((game) => game.media !== null && game.start_time_tbd === false);
};
