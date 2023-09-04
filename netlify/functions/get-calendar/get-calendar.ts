import { Handler } from "@netlify/functions";
import { getCalendar } from "../../../shared/cfbd";
import { getHeaders } from "../../../shared/utils";

export const handler: Handler = async (event) => {
  const { season } = event.queryStringParameters || {};

  const headers = getHeaders();

  const year = season || new Date().getFullYear().toString();

  const calendar = await getCalendar(year);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(calendar),
  };
};
