import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async login() {
    // Implement your login logic here
    return {
      message: 'Login successful',
    };
  }

  async register() {
    // Implement your registration logic here
    //!TODO:  remove below code
    const user = await this.prismaService.user.findMany({
      where: { is_active: true },
    });

    return {
      message: 'Registration successful',
      users: user,
    };
  }
}
