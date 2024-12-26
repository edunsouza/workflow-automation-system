export interface Worker<T = any> {
  run: (...params: any) => Promise<T>;
}

export interface EventConsumer {
  handle: (event: any) => Promise<void>;
}