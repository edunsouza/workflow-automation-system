// TODO: use real logger
const withTime = (text: string) => `${new Date().toISOString().substring(0, 19)}: ${text}`;

export const logger: Logger = {
  info: (message: string) => console.log(withTime(message)),
  error: (error: string | Error) => {
    const message = error instanceof Error ? error.message : error;
    console.error(withTime(message));
  }
};

export interface Logger {
  info: (log: string) => void;
  error: (log: string) => void;
}