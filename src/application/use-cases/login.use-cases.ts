import { Inject, Injectable } from '@nestjs/common';
import { UserUseCases } from './user.use-cases';
import { TokenGeneratorPort } from 'src/domain/ports/token-generator.port';

@Injectable()
export class LoginUseCases {
  constructor(
    private readonly userUseCases: UserUseCases,
    @Inject('TokenGeneratorPort')
    private readonly tokenGenerator: TokenGeneratorPort,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userUseCases.validateUser(username, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return {
      accessToken: this.tokenGenerator.generateToken(user),
      user,
    };
  }
}
