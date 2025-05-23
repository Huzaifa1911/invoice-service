import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { AuthEntity } from './entity/auth.entity';
import { LoginDTO, signupDTO } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  async login(@Body() { email, password }: LoginDTO) {
    return this.authService.login({ email, password });
  }

  @Post('register')
  @ApiOkResponse({ type: AuthEntity })
  async register(@Body() payload: signupDTO) {
    return this.authService.register(payload);
  }
}
