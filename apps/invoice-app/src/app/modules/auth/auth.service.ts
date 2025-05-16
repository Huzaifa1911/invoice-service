import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login() {
    // Implement your login logic here
    return {
      message: 'Login successful',
    };
  }

  async register() {
    // Implement your registration logic here
    return {
      message: 'Registration successful',
    };
  }
}
