import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../../../../generated/prisma';

export class AuthEntity {
  @ApiProperty({ type: () => Object })
  user!: User;

  @ApiProperty({ type: String })
  accessToken!: string;
}
