import { Controller, Post, Body } from '@nestjs/common';
import { LoginUseCases } from '../../application/use-cases/login.use-cases';
import { Login } from '../../domain/entities/login.entity';

@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginUseCases) {}

  @Post('login')
  async login(@Body() loginDto: Login) {
    return this.loginService.login(loginDto.username, loginDto.password);
  }
}
