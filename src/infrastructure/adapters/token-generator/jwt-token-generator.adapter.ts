import { User } from 'src/domain/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { TokenGeneratorPort } from 'src/domain/ports/token-generator.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtTokenGenerator implements TokenGeneratorPort {
  constructor(private readonly jwtService: JwtService) {}
  generateToken(user: User): string {
    return this.jwtService.sign(
      { id: user.id, email: user.email },
      {
        expiresIn: '1h',
      },
    );
  }
}
