/**
 * auth.service.spec.ts
 *
 * Jest test suite for AuthService.
 * Mocks external dependencies (PrismaService, JwtService, bcrypt) to verify:
 *  - login: user not found, invalid password, successful login generates JWT.
 *  - register: user exists conflict, successful registration hashes password, creates user, and generates JWT.
 */

import {
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService, roundsOfHashing } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

// Mock bcrypt methods
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let mockJwtService: {
    sign: jest.Mock;
  };

  beforeEach(() => {
    // Reset and configure mocks before each test
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    authService = new AuthService(
      mockPrismaService as unknown as PrismaService,
      mockJwtService as unknown as JwtService
    );

    // Clear bcrypt mocks
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  describe('login', () => {
    it('should throw NotFoundException if user is not found', async () => {
      // Arrange: simulate no user found
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login({
          email: 'nouser@example.com',
          password: 'password123',
        })
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nouser@example.com' },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange: simulate user found but invalid password
      const foundUser = {
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashedpass',
        role: 'USER',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(foundUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        foundUser.password
      );
    });

    it('should return user and accessToken when credentials are valid', async () => {
      // Arrange: simulate valid user and password
      const foundUser = {
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashedpass',
        role: 'USER',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(foundUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('signed.jwt.token');

      // Act
      const result = await authService.login({
        email: 'user@example.com',
        password: 'correctpassword',
      });

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctpassword',
        foundUser.password
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: foundUser.email,
        id: foundUser.id,
        role: foundUser.role,
      });
      expect(result).toEqual({
        user: foundUser,
        accessToken: 'signed.jwt.token',
      });
    });
  });

  describe('register', () => {
    it('should throw ConflictException if user with given email already exists', async () => {
      // Arrange: simulate existing user
      const existingUser = {
        id: 'user-1',
        email: 'already@example.com',
        password: 'hashed',
        full_name: 'John Doe',
        role: 'USER',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        authService.register({
          email: 'already@example.com',
          password: 'password123',
          full_name: 'John Doe',
        })
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'already@example.com' },
      });
    });

    it('should hash password, create user, and return success response when registration is valid', async () => {
      // Arrange: simulate no existing user
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const createdUser = {
        id: 'user-2',
        email: 'new@example.com',
        password: 'newHashedPassword',
        full_name: 'Jane Doe',
        role: 'USER',
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('new.jwt.token');

      // Act
      const result = await authService.register({
        email: 'new@example.com',
        password: 'plainPassword',
        full_name: 'Jane Doe',
      });

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'plainPassword',
        roundsOfHashing
      );
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'newHashedPassword',
          full_name: 'Jane Doe',
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: createdUser.email,
        id: createdUser.id,
        role: createdUser.role,
      });

      expect(result).toEqual({
        message: 'Registration successful',
        user: createdUser,
        accessToken: 'new.jwt.token',
      });
    });
  });
});
