/**
 * auth.controller.spec.ts
 *
 * Jest test suite for AuthController.
 * Mocks AuthService to verify that controller methods call the service correctly
 * and return expected values.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDTO } from '../dto/auth.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    // Create a mock AuthService with jest.fn() for login and register
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login with correct parameters and return AuthEntity', async () => {
      // Arrange
      const loginDto: LoginDTO = {
        email: 'user@example.com',
        password: 'secret',
      };
      const expectedResponse = {
        id: 'user-id-123',
        email: 'user@example.com',
        accessToken: 'jwt-token',
      };

      // Mock authService.login to resolve with expectedResponse
      (authService.login as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await authController.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate exceptions thrown by authService.login', async () => {
      // Arrange
      const loginDto: LoginDTO = {
        email: 'fail@example.com',
        password: 'wrong',
      };
      const testError = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(testError);

      // Act & Assert
      await expect(authController.login(loginDto)).rejects.toThrow(testError);
      expect(authService.login).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
    });
  });

  describe('register', () => {
    it('should call authService.register with correct payload and return AuthEntity', async () => {
      // Arrange
      const signupDto = {
        email: 'newuser@example.com',
        password: 'newpass',
        firstName: 'John',
        lastName: 'Doe',
      };
      const expectedResponse = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        accessToken: 'new-jwt-token',
      };

      // Mock authService.register to resolve with expectedResponse
      (authService.register as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await authController.register(signupDto as any);

      // Assert
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate exceptions thrown by authService.register', async () => {
      // Arrange
      const signupDto = {
        email: 'error@example.com',
        password: 'badpass',
        firstName: 'Error',
        lastName: 'Case',
      };
      const testError = new Error('Registration failed');
      (authService.register as jest.Mock).mockRejectedValue(testError);

      // Act & Assert
      await expect(authController.register(signupDto as any)).rejects.toThrow(
        testError
      );
      expect(authService.register).toHaveBeenCalledWith(signupDto);
    });
  });
});
