import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { AllExceptionsFilter } from './middleware/http-exception.filter';
import { WinstonLoggerAdapter } from './middleware/winston-logger.adapter';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { PiconixLogTransport } from './middleware/piconix.logger';
import { HttpAdapterHost } from '@nestjs/core';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'WINSTON_LOGGER',
      useFactory: () => {
        return winston.createLogger({
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                nestWinstonModuleUtilities.format.nestLike('piconix', {
                  colors: true,
                  prettyPrint: true,
                }),
              ),
            }),
            new PiconixLogTransport({
              handleExceptions: true,
              handleRejections: true,
            }),
          ],
        });
      },
    },
    {
      provide: 'LOGGER',
      useFactory: (winstonLogger) => {
        return new WinstonLoggerAdapter(winstonLogger);
      },
      inject: ['WINSTON_LOGGER'],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useFactory: (httpAdapterHost, logger) => {
        return new AllExceptionsFilter(httpAdapterHost, logger);
      },
      inject: [HttpAdapterHost, 'LOGGER'],
    },
  ],
})
export class AppModule { }
