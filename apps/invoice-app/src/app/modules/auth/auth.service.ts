import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDTO, signupDTO } from './dto/auth.dto';

export const roundsOfHashing = 10;

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService
  ) {}

  async login({ email, password }: LoginDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email: email },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new NotFoundException(`User not found for email: ${email}`);
    }

    // Step 2: Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // // If password does not match, throw an error
    if (!isPasswordValid) {
      throw new UnauthorizedException(`Invalid password for email: ${email}`);
    }

    // Step 3: Generate a JWT token
    return {
      user,
      accessToken: this.jwtService.sign({
        email: user.email,
        id: user.id,
        role: user.role,
      }),
    };
  }

  async register({ email, password, full_name, role = 'USER' }: signupDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (user) {
      throw new ConflictException(`User with email ${email} already exists`);
    } else {
      const hashedPassword = await bcrypt.hash(password, roundsOfHashing);
      const user = await this.prismaService.user.create({
        data: {
          email,
          password: hashedPassword,
          full_name,
          role,
        },
      });

      return {
        message: 'Registration successful',
        user,
        accessToken: this.jwtService.sign({
          email: user.email,
          id: user.id,
          role: user.role,
        }),
      };
    }
  }
}
