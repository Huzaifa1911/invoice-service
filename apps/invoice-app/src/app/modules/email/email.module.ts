import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST', 'localhost'),
          port: config.get<number>('SMTP_PORT', 1025),
          secure: false, // true for 465, false for others
          // secure: config.get<boolean>('SMTP_SECURE', false), // true for 465, false for others
          // auth: {
          //   user: config.get('SMTP_USER'),
          //   pass: config.get('SMTP_PASS'),
          // },
        },
        defaults: {
          from: `"${config.get('APP_NAME')}" <${config.get('SMTP_FROM')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
