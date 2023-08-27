import { Handler } from "@netlify/functions";
import {
  Schedule,
  Team,
  getMedia,
  getGames,
  getTeams,
  mediaTypeSchema,
  seasonTypeSchema,
  Media,
} from "../../shared/cfbd";

export const handler: Handler = async (event) => {
  const {
    week = "1",
    season,
    seasonType = "regular",
    mediaType = "tv",
  } = event.queryStringParameters || {};
  const year = season || new Date().getFullYear().toString();

  const type = seasonTypeSchema.parse(seasonType);
  const [scheduleResult, teamResult, mediaResult] = await Promise.all([
    getGames(year, week, type),
    getTeams(),
    getMedia(year, week, type, mediaTypeSchema.parse(mediaType)),
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

  if (!mediaResult.success) {
    return {
      statusCode: mediaResult.statusCode,
      body: JSON.stringify(mediaResult.data),
    };
  }

  const schedule = getMappedSchedule(
    scheduleResult.data,
    teamResult.data,
    mediaResult.data
  );

  const body = JSON.stringify(schedule);

  return {
    statusCode: 200,
    body: body,
  };
};

const getMappedSchedule = (
  schedule: Schedule[],
  teams: Record<number, Team>,
  media: Record<number, Media>
) => {
  return schedule
    .map((game) => ({
      ...game,
      home_team: teams[game.home_id],
      away_team: teams[game.away_id],
      media: media[game.id] || null,
    }))
    .filter((game) => game.media !== null && game.start_time_tbd === false);
};
