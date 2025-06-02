import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../../../logger/logger';
import { RabbitMQService } from '../rabbitmq.service';
import { Channel, Connection } from 'amqplib';

// ─── Mock amqplib.connect ─────────────────────────────────────────────────────────────
// When RabbitMQService calls `connect(...)`, we return a fake connection object.
jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import { connect } from 'amqplib';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let mockConfig: Partial<ConfigService>;
  let fakeConnection: Partial<Connection>;
  let fakeChannel: Partial<Channel>;
  let mockLoggerLog: jest.Mock;
  let mockLoggerError: jest.Mock;

  beforeEach(async () => {
    // Prepare fake channel with required methods
    fakeChannel = {
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Prepare fake connection with createChannel() and close()
    fakeConnection = {
      createChannel: jest.fn().mockResolvedValue(fakeChannel),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as Partial<Connection>;

    // Make `connect(...)` return our fake connection
    (connect as jest.Mock).mockResolvedValue(fakeConnection);

    // Mock ConfigService to provide URL and PORT
    mockConfig = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'RABBITMQ_URL') return 'amqp://localhost';
        if (key === 'RABBITMQ_PORT') return '5672';
        return undefined;
      }),
    };

    // Instantiate service
    service = new RabbitMQService(mockConfig as ConfigService);

    // Override private logger methods
    const loggerInstance = (service as any).logger as AppLogger;
    loggerInstance.log = jest.fn();
    loggerInstance.error = jest.fn();
    mockLoggerLog = loggerInstance.log as jest.Mock;
    mockLoggerError = loggerInstance.error as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect using URL and port, create channel, and log success', async () => {
      await service.onModuleInit();

      // Expect connect called with concatenated URL:port
      expect(connect).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledWith('amqp://localhost:5672', {});

      // Expect channel creation
      expect((fakeConnection as any).createChannel).toHaveBeenCalledTimes(1);

      // Expect logs
      expect(mockLoggerLog).toHaveBeenCalledWith('Connecting to RabbitMQ...');
      expect(mockLoggerLog).toHaveBeenCalledWith(
        'Connected to RabbitMQ successfully'
      );
    });

    it('should propagate and log errors if connect() fails', async () => {
      const connError = new Error('Connection failed');
      (connect as jest.Mock).mockRejectedValue(connError);

      await expect(service.onModuleInit()).rejects.toThrow(connError);

      expect(mockLoggerLog).toHaveBeenCalledWith('Connecting to RabbitMQ...');
      // No "Connected" log because it fails early
      expect(mockLoggerError).not.toHaveBeenCalledWith(
        expect.stringContaining('Connecting to RabbitMQ...'),
        connError
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should close channel and connection and log steps', async () => {
      // First initialize so channel & connection exist
      await service.onModuleInit();

      await service.onModuleDestroy();

      expect(mockLoggerLog).toHaveBeenCalledWith(
        'Closing RabbitMQ connection...'
      );
      // Channel close & connection close should both be awaited
      expect(fakeChannel!.close).toHaveBeenCalledTimes(1);
      expect((fakeConnection as any).close).toHaveBeenCalledTimes(1);
      expect(mockLoggerLog).toHaveBeenCalledWith('RabbitMQ connection closed');
    });

    it('should handle missing channel or connection gracefully', async () => {
      // Do not call onModuleInit, so channel & connection remain undefined
      await service.onModuleDestroy();
      // Should log closing attempt then final message
      expect(mockLoggerLog).toHaveBeenCalledWith(
        'Closing RabbitMQ connection...'
      );
      expect(mockLoggerLog).toHaveBeenCalledWith('RabbitMQ connection closed');
    });
  });

  describe('publish', () => {
    const queueName = 'testQueue';
    const messageObj = { foo: 'bar' };

    beforeEach(async () => {
      // Ensure service is initialized so channel exists
      await service.onModuleInit();
    });

    it('should assert queue, send message, and log actions', async () => {
      await service.publish(queueName, messageObj);

      // Should assert queue durable: true
      expect(fakeChannel!.assertQueue).toHaveBeenCalledWith(queueName, {
        durable: true,
      });
      // sendToQueue with JSON buffer
      expect(fakeChannel!.sendToQueue).toHaveBeenCalledWith(
        queueName,
        Buffer.from(JSON.stringify(messageObj)),
        { persistent: true }
      );
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Publishing message to queue: ${queueName}`
      );
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Message published to queue: ${queueName}`
      );
    });

    it('should catch errors, log, and rethrow', async () => {
      const pubError = new Error('Send failed');
      (fakeChannel!.assertQueue as jest.Mock).mockRejectedValue(pubError);

      await expect(service.publish(queueName, messageObj)).rejects.toThrow(
        `Failed to publish message to queue: ${queueName}`
      );

      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Publishing message to queue: ${queueName}`
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to publish message to queue: ${queueName}`,
        pubError
      );
    });
  });

  describe('consume', () => {
    const queueName = 'consumeQueue';
    const samplePayload = { id: 123 };
    let consumeCallback: (payload: any) => void;

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should assert queue, consume messages, ack them, and log actions', async () => {
      // Prepare fake message object
      const fakeMsg = {
        content: Buffer.from(JSON.stringify(samplePayload)),
      } as any;

      // Capture the callback provided to channel.consume
      (fakeChannel!.consume as jest.Mock).mockImplementation(
        (_queue, onMessage) => {
          // Simulate immediate message delivery
          onMessage(fakeMsg);
        }
      );

      // Spy on user-provided callback
      const userCallback = jest.fn((payload) => {
        expect(payload).toEqual(samplePayload);
      });

      await service.consume(queueName, userCallback);

      // Assertions
      expect(fakeChannel!.assertQueue).toHaveBeenCalledWith(queueName, {
        durable: true,
      });
      expect(fakeChannel!.consume).toHaveBeenCalledWith(
        queueName,
        expect.any(Function)
      );
      // After onMessage is invoked, callback and ack should be called
      expect(userCallback).toHaveBeenCalledWith(samplePayload);
      expect(fakeChannel!.ack).toHaveBeenCalledWith(fakeMsg);
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Consuming messages from queue: ${queueName}`
      );
      expect(mockLoggerLog).toHaveBeenCalledWith(
        `Started consuming messages from queue: ${queueName}`
      );
    });

    it('should catch errors during consume, log error, and rethrow', async () => {
      const consError = new Error('Consume failed');
      (fakeChannel!.assertQueue as jest.Mock).mockRejectedValue(consError);

      const dummyCallback = jest.fn();
      await expect(service.consume(queueName, dummyCallback)).rejects.toThrow(
        `Failed to consume messages from queue: ${queueName}`
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to consume messages from queue: ${queueName}`,
        consError
      );
    });
  });
});
