// application/use-cases/user-use-cases.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { EncrypterPort } from 'src/domain/ports/encrypter.port';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserUseCases {
  constructor(
    @Inject('UserRepositoryPort')
    private userRepository: UserRepositoryPort,
    @Inject('EncrypterPort')
    private encrypter: EncrypterPort,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmailAuth(email);

    if (user && (await this.encrypter.compare(password, user.password))) {
      // avoid return password after to validate
      delete user.password;

      return user;
    }

    return null;
  }
  async validateUserBasic(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmailAuth(username);

    if (this.configService.get('BASIC_PASS') !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.encrypter.hash(newPassword);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByIdAuth(id: string): Promise<User | null> {
    return this.userRepository.findByIdAuth(id);
  }

  async createUser(user: User): Promise<User> {
    const hashedPassword = await this.encrypter.hash(user.password);
    user.password = hashedPassword;
    const createdUser = await this.userRepository.create(user);
    return createdUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, user);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
