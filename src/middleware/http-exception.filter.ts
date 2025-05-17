import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, LoggerService } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { formatErrorLogData } from './logs.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(
		private readonly httpAdapterHost: HttpAdapterHost,
		private readonly logger: LoggerService,
	) { }

	catch(
		exception: PrismaClientKnownRequestError | PrismaClientValidationError | HttpException | unknown,
		host: ArgumentsHost,
	) {
		const { httpAdapter } = this.httpAdapterHost;
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const path = `${request.method} ${httpAdapter.getRequestUrl(request)}`;

		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const userId = request.user ? request.user.userId : 'anonymous';

		switch (true) {
			case exception instanceof PrismaClientKnownRequestError:
			case exception instanceof PrismaClientValidationError:
			case exception instanceof HttpException: {
				const logData = formatErrorLogData({
					userId,
					path,
					statusCode: status,
					exception,
				});
				const { name, meta, code } = logData;
				response.status(status).json({ name, meta, code, path });
				this.logger.error(logData.message, logData, path);
				break;
			}

			default: {
				// Handle other exceptions
				const logData = formatErrorLogData({
					userId,
					path,
					statusCode: status,
					exception,
				});
				const { name, code } = logData;
				httpAdapter.reply(
					response,
					{
						name,
						code,
						path,
					},
					status,
				);
				this.logger.error(logData.message, logData, path);
				break;
			}
		}
	}
}
