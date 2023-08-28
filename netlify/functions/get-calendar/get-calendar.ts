import { Handler } from "@netlify/functions";
import { getCalendar } from "../../../shared/cfbd";
import { getHeaders } from "../../../shared/utils";

export const handler: Handler = async (event) => {
  const { season } = event.queryStringParameters || {};

  const headers = getHeaders();

  const year = season || new Date().getFullYear().toString();

  const calendarResult = await getCalendar(year);

  if (!calendarResult.success) {
    return {
      statusCode: calendarResult.statusCode,
      body: JSON.stringify(calendarResult.data),
      headers,
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(calendarResult.data),
  };
};
