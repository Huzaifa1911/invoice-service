import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/common.decorator';
import { Role } from '../../../../generated/prisma';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('/send-test-email')
  @Roles(Role.ADMIN)
  async sendTestEmail(@Body('to') to: string) {
    await this.emailService.sendTestEmail(to);
    return { message: 'Test email sent successfully' };
  }
}
