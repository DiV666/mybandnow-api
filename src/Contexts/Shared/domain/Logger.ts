export default interface Logger {
  error(obj: unknown, ...args: string[]): void;
  warn(obj: unknown, ...args: string[]): void;
  info(obj: unknown, ...args: string[]): void;
  debug(obj: unknown, ...args: string[]): void;
}
