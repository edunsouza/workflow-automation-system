export const getExponentialBackoff = (retries: number) => {
  const base = retries < 5 ? 5 : retries + 2;
  const backoff = (base - retries) ** 2;
  return Date.now() + (backoff * 1000);
}