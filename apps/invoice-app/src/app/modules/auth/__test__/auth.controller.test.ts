import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDTO, signupDTO } from '../dto/auth.dto';
import { AuthEntity } from '../entity/auth.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResult: AuthEntity = {
    accessToken: 'mock-token',
    user: {
      id: '1',
      email: 'test@example.com',
      full_name: 'New User',
    },
  } as unknown as AuthEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login()', () => {
    it('should return auth result from service', async () => {
      const dto: LoginDTO = {
        email: 'test@example.com',
        password: 'securepass',
      };

      authService.login.mockResolvedValueOnce(mockAuthResult);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResult);
    });
  });

  describe('register()', () => {
    it('should return auth result from service', async () => {
      const dto: signupDTO = {
        email: 'newuser@example.com',
        password: 'newpass',
        full_name: 'New User',
      };

      authService.register.mockResolvedValueOnce(mockAuthResult as any);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResult);
    });
  });
});
