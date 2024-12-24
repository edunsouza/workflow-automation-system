const units = {
  'h': 60 * 60 * 1000,
  'm': 60 * 1000,
  's': 1000
};

// 30s / 5m / 1h
export const intervalToMillis = (interval: string) => {
  const number = parseInt(interval.match(/^\d+/gi)?.[0]) || 0;
  const unit = interval.match(/\D/gi)?.[0];
  const millis = number * units[unit];
  return millis || 0;
};