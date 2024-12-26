export const safeParse = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (_) {
    return content;
  }
};