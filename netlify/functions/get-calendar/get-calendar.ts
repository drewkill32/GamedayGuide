import { Handler } from "@netlify/functions";
import { getCalendar } from "../../shared/cfbd";

export const handler: Handler = async (event) => {
  const { season } = event.queryStringParameters || {};

  const year = season || new Date().getFullYear().toString();

  const calendarResult = await getCalendar(year);

  if (!calendarResult.success) {
    throw new Error(calendarResult.data);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(calendarResult.data),
  };
};
