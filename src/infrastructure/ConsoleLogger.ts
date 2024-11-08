import { ILogger } from "src/domain/ILogger";

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export class ConsoleLogger implements ILogger {
	private logLevel: LogLevel;

	constructor(logLevel: LogLevel) {
		this.logLevel = logLevel;
	}

	private getTime(): string {
		return new Date().toLocaleTimeString();
	}

	debug(msg: string): void {
		if (this.logLevel > LogLevel.DEBUG) {
			return;
		}
		console.debug(`[PW][DEBUG] ${this.getTime()}: ${msg}`);
	}

	info(msg: string): void {
		if (this.logLevel > LogLevel.INFO) {
			return;
		}
		console.log(`[PW][INFO]  ${this.getTime()}: ${msg}`);
	}

	warn(msg: string): void {
		if (this.logLevel > LogLevel.WARN) {
			return;
		}
		console.warn(`[PW][WARN]  ${this.getTime()}: ${msg}`);
	}

	error(msg: string): void {
		if (this.logLevel > LogLevel.ERROR) {
			return;
		}
		console.error(`[PW][ERROR] ${this.getTime()}: ${msg}`);
	}
}
