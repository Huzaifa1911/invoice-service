/* eslint-disable @typescript-eslint/no-empty-function */
import { AppLogger } from '../logger';
import { ConsoleLogger } from '@nestjs/common';

describe('AppLogger', () => {
  let logger: AppLogger;

  beforeEach(() => {
    logger = new AppLogger();

    // Spy on all ConsoleLogger methods
    jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(ConsoleLogger.prototype, 'verbose').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should format and call log correctly', () => {
    const message = 'App started';
    logger.log(message);

    expect(ConsoleLogger.prototype.log).toHaveBeenCalledWith(message);
  });

  it('should format and call error correctly without trace', () => {
    const message = 'Error occurred';
    logger.error(message);

    expect(ConsoleLogger.prototype.error).toHaveBeenCalledWith(message);
  });

  it('should format and call error correctly with trace', () => {
    const message = 'Error occurred';
    const trace = 'stack trace';
    const expected = `${message}\n\n${trace}`;

    logger.error(message, trace);

    expect(ConsoleLogger.prototype.error).toHaveBeenCalledWith(expected);
  });

  it('should format and call warn correctly', () => {
    const message = 'This is a warning';
    logger.warn(message);

    expect(ConsoleLogger.prototype.warn).toHaveBeenCalledWith(message);
  });

  it('should format and call debug correctly', () => {
    const message = 'Debug info';
    logger.debug(message);

    expect(ConsoleLogger.prototype.debug).toHaveBeenCalledWith(message);
  });

  it('should format and call verbose correctly', () => {
    const message = 'Verbose log';
    logger.verbose(message);

    expect(ConsoleLogger.prototype.verbose).toHaveBeenCalledWith(message);
  });
});
