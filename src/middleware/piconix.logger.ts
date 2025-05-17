import * as TransportStream from 'winston-transport';
import { PrismaClient } from '@prisma/client';
import { MakejaLog } from './logs.util';

export class PiconixLogTransport extends TransportStream {
	constructor(opts: any) {
		opts.handleExceptions = true;
		super(opts);
		this.prisma = new PrismaClient();
	}

	private prisma: PrismaClient;

	async sendLogs(logInfo: MakejaLog): Promise<void> {
		try {
			// Create a log entry using Prisma
			await this.prisma.logs.create({
				data: logInfo,
			});
			return;
		} catch (error) {
			// Handle any errors that occur during logging
			console.error('Error logging:', error);
			// TODO send to file
			return;
		}
	}

	async log(logData: any, callback: () => void) {
		// Extract log data
		const { level } = logData;

		if (level === 'error') {
			// send logs to db Logs table
			let errLogData;
			if (Array.isArray(logData.stack) && logData.stack.length > 0) {
				errLogData = logData.stack[0];
			} else {
				errLogData = logData; // fallback to logging the whole object
			}
			// await this.sendLogs(errLogData);
		}
		if (level === 'warn') {
			// console.warn('Warning:', message);
			// await this.sendLogs(level, message, timestamp);
		}
		if (level === 'info') {
			// console.info('Info');
		}

		callback();
	}

	async close() {
		await this.prisma.$disconnect();
	}
}

export default PiconixLogTransport;
