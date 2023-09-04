import { Handler } from "@netlify/functions";
import { getHeaders } from "../../../shared/utils";
import { getMedia } from "../../../shared/cfbd";
import {
  Media,
  mediaTypeSchema,
  seasonTypeSchema,
} from "../../../shared/schema";

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
  const mediaResult = await getMedia(
    year,
    week,
    type,
    mediaTypeSchema.parse(mediaType)
  );

  if (!mediaResult.success) {
    return {
      statusCode: mediaResult.statusCode,
      body: JSON.stringify(mediaResult.data),
      headers,
    };
  }

  let data = mediaResult.data.map((m) => ({
    date: m.dateOnly,
    outlet: m.outlet,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(data),
    headers,
  };
};
