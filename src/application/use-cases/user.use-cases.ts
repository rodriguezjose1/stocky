// application/use-cases/user-use-cases.ts
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncrypterPort } from 'src/domain/ports/encrypter.port';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { userErrors } from '../error.constants';
import { RoleUseCases } from './role.use-cases';

@Injectable()
export class UserUseCases {
  constructor(
    @Inject('UserRepositoryPort')
    private userRepository: UserRepositoryPort,
    @Inject('EncrypterPort')
    private encrypter: EncrypterPort,
    private roleUseCases: RoleUseCases,
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

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
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

  async createUser(user: User, caller: string = 'admin'): Promise<User> {
    const userInDB = await this.userRepository.findByEmail(user.email);
    if (userInDB) {
      throw new BadRequestException(userErrors.userAlreadyExists);
    }

    if (!user.password) {
      user.password = this.configService.get('DEFAULT_PASSWORD');
    }
    if (caller === 'customer') {
      const customerRole = await this.roleUseCases.getRoleByName('customer');
      user.roles = [customerRole.id];
    }
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

  async findResellers(filter): Promise<any> {
    return this.userRepository.findResellers(filter);
  }

  async findCustomers(filter): Promise<any> {
    return this.userRepository.findCustomers(filter);
  }

  async findOnlyRoleAdmins(): Promise<User[]> {
    return this.userRepository.findOnlyRoleAdmins();
  }
}
