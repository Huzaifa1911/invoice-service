import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: '1fc75fe9-3974-4e52-a920-2fae34726b51' })
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  quantity!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customer!: string;

  @ApiProperty({ example: '2025-05-19T12:00:00Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({
    type: [CreateInvoiceItemDto],
    description: 'List of invoice items',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  @ArrayMinSize(1)
  items!: CreateInvoiceItemDto[];
}
