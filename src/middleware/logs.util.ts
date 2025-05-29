import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { HttpException, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { baseSchema, defaultOmits, jsonSchema as prismaZodJsonSchema } from '../types/common.schema';

const piconixLogSchema = z.object({
	userId: z.string(),
	name: z.string(),
	code: z.string(),
	path: z.string(),
	message: z.string(),
	stack: z.string(),
	timestamp: z.string(),
	...baseSchema,
	meta: z.any(),
});

const getPiconixLogSchema = piconixLogSchema
	.omit({
		id: true,
		...defaultOmits,
	})
	.and(prismaZodJsonSchema.optional());
export type PiconixLog = z.infer<typeof getPiconixLogSchema>;

type ExceptionLogInput = {
	userId: string;
	path: string;
	statusCode: number;
	exception: PrismaClientKnownRequestError | PrismaClientValidationError | HttpException | unknown;
};

export const formatErrorLogData = (errorDeets: ExceptionLogInput): PiconixLog => {
	const { userId, path, statusCode, exception } = errorDeets;
	const timestamp = new Date().toISOString();
	switch (true) {
		case exception instanceof PrismaClientKnownRequestError: {
			const prismaErrorData = exception as PrismaClientKnownRequestError;
			return {
				userId,
				name: prismaErrorData.name,
				code: prismaErrorData.code,
				path,
				message: `${prismaErrorData.name}: ${prismaErrorData.message}`,
				stack: prismaErrorData.stack || `${prismaErrorData}`,
				timestamp,
				meta: convertToJsonString({ clientVersion: prismaErrorData.clientVersion, meta: prismaErrorData.meta }),
			};
		}
		case exception instanceof PrismaClientValidationError: {
			return {
				userId,
				name: exception.name,
				code: statusCode.toString(),
				path,
				message: `PrismaClientValidationError: ${exception.message}`,
				stack: exception.stack || `${exception}`,
				timestamp,
				meta: { clientVersion: exception.clientVersion },
			};
		}
		case exception instanceof HttpException: {
			return {
				userId,
				name: exception.name,
				code: statusCode.toString(),
				path,
				message: exception.message,
				stack: exception.stack || `${exception}`,
				timestamp,
				meta: convertToJsonString({ cause: exception.cause, message: exception.getResponse() }),
			};
		}
		default: {
			return {
				userId,
				name: 'UnknownError',
				code: HttpStatus.INTERNAL_SERVER_ERROR.toString(),
				path,
				message: 'An unknown error occurred',
				stack: `${exception}`,
				timestamp,
			};
		}
	}
};

const convertToJsonString = (data: Record<string, any>): string => {
	return JSON.stringify(data);
};
