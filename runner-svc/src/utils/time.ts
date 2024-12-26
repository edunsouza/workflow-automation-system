export const getExponentialBackoff = (retries: number) => {
  const base = retries < 6 ? 6 : retries + 2;
  const backoff = (base - retries) ** 2;
  return Date.now() + (backoff * 1000);
}