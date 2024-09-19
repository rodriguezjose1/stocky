import * as bcrypt from 'bcrypt';
import { EncrypterPort } from 'src/domain/ports/encrypter.port';

export class BcryptEncrypter implements EncrypterPort {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
