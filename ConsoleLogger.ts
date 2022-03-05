import { ILogger } from "ILogger";

export class ConsoleLogger implements ILogger {
  debug(msg: string): void {
    console.debug(`[PW]: ${msg}`)
  }
  info(msg: string): void {
    console.log(`[PW]: ${msg}`)
  }
  warn(msg: string): void {
    console.warn(`[PW]: ${msg}`)
  }
  error(msg: string): void {
    console.error(`[PW]: ${msg}`)
  }

}