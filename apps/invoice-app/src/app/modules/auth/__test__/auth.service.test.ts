import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService, roundsOfHashing } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { signupDTO } from '../dto/auth.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;

  const mockUser = {
    id: '1',
    email: 'user@example.com',
    password: 'hashedPass',
    full_name: 'User Test',
    role: 'USER',
  };

  const token = 'signed-jwt-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue(token),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('should throw NotFoundException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@example.com', password: 'test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: mockUser.email, password: 'wrongpass' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and token if credentials are valid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: mockUser.email,
        password: 'correctpass',
      });

      expect(result).toEqual({
        user: mockUser,
        accessToken: token,
      });

      expect(jwt.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        id: mockUser.id,
        role: mockUser.role,
      });
    });
  });

  describe('register', () => {
    const newUser: signupDTO = {
      email: 'new@example.com',
      password: 'plainpass',
      full_name: 'New User',
    };

    it('should throw ConflictException if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(newUser)).rejects.toThrow(
        ConflictException
      );
    });

    it('should create a user and return token if email is unique', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const createdUser = { ...mockUser, password: 'hashedPassword' };
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(newUser);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        newUser.password,
        roundsOfHashing
      );
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: newUser.email,
          password: 'hashedPassword',
          full_name: newUser.full_name,
          role: 'USER',
        },
      });

      expect(result).toEqual({
        message: 'Registration successful',
        user: createdUser,
        accessToken: token,
      });

      expect(jwt.sign).toHaveBeenCalledWith({
        email: createdUser.email,
        id: createdUser.id,
        role: createdUser.role,
      });
    });

    it('should accept custom role on registration', async () => {
      const dto: signupDTO = {
        email: 'admin@example.com',
        password: 'adminpass',
        full_name: 'Admin',
        role: 'ADMIN',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: dto.email,
        full_name: dto.full_name,
        password: 'hashedPassword',
        role: 'ADMIN',
      });

      const result = await service.register(dto);

      expect(result.user.role).toBe('ADMIN');
    });
  });
});
