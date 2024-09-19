import { User } from '../entities/user.entity';

export interface TokenGeneratorPort {
  generateToken(user: User): string;
}
