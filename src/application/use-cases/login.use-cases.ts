import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserUseCases } from './user.use-cases';
import { TokenGeneratorPort } from 'src/domain/ports/token-generator.port';

@Injectable()
export class LoginUseCases {
  constructor(
    private readonly userUseCases: UserUseCases,
    @Inject('TokenGeneratorPort')
    private readonly tokenGenerator: TokenGeneratorPort,
    @Inject('TokenGeneratorBasicPort')
    private readonly tokenGeneratorBasic: TokenGeneratorPort,
  ) {}

  async login(username: string, password: string) {
    throw new Error('Method not implemented.');
    const user = await this.userUseCases.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      accessToken: this.tokenGenerator.generateToken(user),
      basicToken: this.tokenGeneratorBasic.generateToken(user),
      user,
    };
  }
}
