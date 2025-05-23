import { Global, Module } from '@nestjs/common';

import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  exports: [RabbitMQService],
  providers: [RabbitMQService],
})
export class RabbitMQModule {}
