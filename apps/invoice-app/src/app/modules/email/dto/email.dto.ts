import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailInvoiceReportDto {
  @ApiProperty({
    description: 'Recipient email address to send the report to',
    example: 'example@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to!: string;
}
