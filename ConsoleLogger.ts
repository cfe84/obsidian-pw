import { ILogger } from "ILogger";

export class ConsoleLogger implements ILogger {
  private getTime(): string {
    return new Date().toLocaleTimeString()
  }
  debug(msg: string): void {
    console.debug(`[PW][DEBUG] ${this.getTime()}: ${msg}`)
  }
  info(msg: string): void {
    console.log(`[PW][INFO]  ${this.getTime()}: ${msg}`)
  }
  warn(msg: string): void {
    console.warn(`[PW][WARN]  ${this.getTime()}: ${msg}`)
  }
  error(msg: string): void {
    console.error(`[PW][ERROR] ${this.getTime()}: ${msg}`)
  }

}