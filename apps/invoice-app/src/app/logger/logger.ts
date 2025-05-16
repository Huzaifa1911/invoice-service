import { ConsoleLogger } from '@nestjs/common';

/**
 * Custom logger class for the application logger.
 * Extends the ConsoleLogger class.
 */
export class AppLogger extends ConsoleLogger {
  /**
   * Formats the log message with an optional trace.
   * @param message - The log message.
   * @param trace - Optional trace information.
   * @returns The formatted log message.
   */
  private _formatMessage(message: string, trace?: string): string {
    const formattedMessage = `${message}`;
    return trace ? `${formattedMessage}\n\n${trace}` : formattedMessage;
  }

  /**
   * Logs a message.
   * @param message - The log message.
   */
  override log(message: string): void {
    const formattedMessage = this._formatMessage(message);
    super.log(formattedMessage);
  }

  /**
   * Logs an error message with an optional trace.
   * @param message - The error message.
   * @param trace - Optional trace information.
   */
  override error(message: string, trace?: string): void {
    const formattedMessage = this._formatMessage(message, trace);
    super.error(formattedMessage);
  }

  /**
   * Logs a warning message.
   * @param message - The warning message.
   */
  override warn(message: string): void {
    const formattedMessage = this._formatMessage(message);
    super.warn(formattedMessage);
  }

  /**
   * Logs a debug message.
   * @param message - The debug message.
   */
  override debug(message: string): void {
    const formattedMessage = this._formatMessage(message);
    super.debug(formattedMessage);
  }

  /**
   * Logs a verbose message.
   * @param message - The verbose message.
   */
  override verbose(message: string): void {
    const formattedMessage = this._formatMessage(message);
    super.verbose(formattedMessage);
  }
}
