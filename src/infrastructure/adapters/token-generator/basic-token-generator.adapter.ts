import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/entities/user.entity';
import { TokenGeneratorPort } from 'src/domain/ports/token-generator.port';

@Injectable()
export class BasicTokenGenerator implements TokenGeneratorPort {
  constructor() {}
  generateToken(user: User): string {
    const textToEncode = user.email + ':' + process.env.BASIC_PASS;
    return Buffer.from(textToEncode).toString('base64');
  }
}
