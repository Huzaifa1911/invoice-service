import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppLoggingMiddleware } from './middlewares/logger.middleware';
import { AuthModule } from './modules';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AppLoggingMiddleware) // Apply both middlewares
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes
  }
}
