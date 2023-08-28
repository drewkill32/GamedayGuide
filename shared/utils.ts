export const getHeaders = () => {
  const headers: { [header: string]: string } = {
    "Content-Type": "application/json",
  };

  if (process.env.NODE_ENV === "development") {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return headers;
};
