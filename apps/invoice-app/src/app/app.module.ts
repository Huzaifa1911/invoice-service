import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppLoggingMiddleware } from './middlewares/logger.middleware';
import { AuthModule, PrismaModule } from './modules';

@Module({
  imports: [PrismaModule, ConfigModule.forRoot({ isGlobal: true }), AuthModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AppLoggingMiddleware) // Apply both middlewares
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes
  }
}
