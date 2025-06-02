import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';
import { AppLogger } from '../../logger/logger';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new AppLogger(RabbitMQService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Connecting to RabbitMQ...');
    this.connection = await connect(
      `${this.configService.get('RABBITMQ_URL')}:${this.configService.get(
        'RABBITMQ_PORT'
      )}`,
      {}
    );
    this.channel = await this.connection.createChannel();
    this.logger.log('Connected to RabbitMQ successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Closing RabbitMQ connection...');
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.logger.log('RabbitMQ connection closed');
  }

  async publish(queue: string, message: any) {
    try {
      this.logger.log(`Publishing message to queue: ${queue}`);
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
      this.logger.log(`Message published to queue: ${queue}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish message to queue: ${queue}`,
        error as any
      );
      throw new Error(`Failed to publish message to queue: ${queue}`, {
        cause: error,
      });
    }
  }

  async consume(queue: string, callback: (payload: any) => void) {
    try {
      this.logger.log(`Consuming messages from queue: ${queue}`);
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.consume(queue, (msg) => {
        if (!msg) return;
        const data = JSON.parse(msg.content.toString());
        callback(data);
        this.channel.ack(msg);
      });

      this.logger.log(`Started consuming messages from queue: ${queue}`);
    } catch (error) {
      this.logger.error(
        `Failed to consume messages from queue: ${queue}`,
        error as any
      );
      throw new Error(`Failed to consume messages from queue: ${queue}`, {
        cause: error,
      });
    }
  }
}
