import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByIdAuth(id: string): Promise<User | null>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailAuth(email: string): Promise<User | null>;
}
