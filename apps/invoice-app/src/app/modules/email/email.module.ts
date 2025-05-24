import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule, // make sure you’ve set up ConfigModule globally
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'localhost',
          port: 1025,
          secure: false, // true for 465, false for others
          // secure: config.get<boolean>('SMTP_SECURE', false), // true for 465, false for others
          // auth: {
          //   user: config.get('SMTP_USER'),
          //   pass: config.get('SMTP_PASS'),
          // },
        },
        // defaults: {
        //   from: `"${config.get('APP_NAME')}" <${config.get('SMTP_FROM')}>`,
        // },
        defaults: {
          from: `"Invoice App" <info@example.com>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
