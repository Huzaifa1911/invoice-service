import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppLoggingMiddleware } from './middlewares/logger.middleware';
import {
  AuthModule,
  InvoiceModule,
  PrismaModule,
  RabbitMQModule,
  SalesReportJob,
  EmailModule,
} from './modules';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    InvoiceModule,
    ScheduleModule.forRoot(),
    RabbitMQModule,
    EmailModule,
  ],
  providers: [SalesReportJob],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AppLoggingMiddleware) // Apply both middlewares
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes
  }
}
