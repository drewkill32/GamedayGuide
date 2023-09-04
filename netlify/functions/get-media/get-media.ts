import { Handler } from "@netlify/functions";
import { getHeaders } from "../../../shared/utils";
import { getMedia } from "../../../shared/cfbd";
import { mediaTypeSchema, seasonTypeSchema } from "../../../shared/schema";

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
  const media = await getMedia(
    year,
    week,
    type,
    mediaTypeSchema.parse(mediaType)
  );

  return {
    statusCode: 200,
    body: JSON.stringify(media),
    headers,
  };
};
