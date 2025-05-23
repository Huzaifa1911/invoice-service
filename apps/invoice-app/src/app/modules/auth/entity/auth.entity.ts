import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../../../generated/prisma';

export class AuthEntity {
  user!: User;

  @ApiProperty()
  accessToken!: string;
}
