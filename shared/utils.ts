export const getHeaders = () => {
  const headers: { [header: string]: string } = {
    "Content-Type": "application/json",
    "Cache-Control": "max-age=300, public",
  };

  if (process.env.NODE_ENV === "development") {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Cache-Control"] = "no-cache";
  }
  return headers;
};
