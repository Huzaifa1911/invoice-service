import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection!: ChannelModel;
  private channel!: Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.connection = await connect(
      `${this.configService.get('RABBITMQ_URL')}:${this.configService.get(
        'RABBITMQ_PORT'
      )}`,
      {}
    );
    this.channel = await this.connection.createChannel();
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publish(queue: string, message: any) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  }

  async consume(queue: string, callback: (payload: any) => void) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.consume(queue, (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      callback(data);
      this.channel.ack(msg);
    });
  }
}
