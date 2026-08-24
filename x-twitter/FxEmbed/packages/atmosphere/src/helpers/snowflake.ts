export const generateSnowflake = () => {
  const epoch = 1288834974657n; /* Twitter snowflake epoch */
  const timestamp = BigInt(Date.now()) - epoch;
  return String((timestamp << 22n) | BigInt(Math.floor(Math.random() * 696969)));
};

/** X/Twitter status snowflake as a string of digits; bounds match URL parsing in embed routes. */
export const TWITTER_NUMERIC_STATUS_ID_PATTERN = /^\d{2,20}$/;

export const isTwitterNumericStatusId = (id: string): boolean =>
  TWITTER_NUMERIC_STATUS_ID_PATTERN.test(id);
