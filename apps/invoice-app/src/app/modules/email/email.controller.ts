import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/common.decorator';
import { Role } from '../../../../generated/prisma';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmailInvoiceReportDto } from './dto/email.dto';

@ApiBearerAuth('access_token')
@ApiTags('Email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Sends an invoice report email to the specified recipient.
   * Only accessible by users with ADMIN role.
   *
   * @param body - The DTO containing recipient email address
   * @returns Success message if email is sent successfully
   * @throws HttpException if email sending fails
   */
  @Post('/send-report')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send invoice report to recipient' })
  @ApiBody({ type: EmailInvoiceReportDto })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendReportToRecipient(
    @Body() body: EmailInvoiceReportDto
  ): Promise<{ message: string }> {
    this.logger.log(`Attempting to send report to ${body.to}`);

    try {
      await this.emailService.sendEmailToRecipent(body.to);
      this.logger.log(`Email sent successfully to ${body.to}`);

      return { message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send email to ${body.to}`, error);
      throw new HttpException(
        'Failed to send email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
