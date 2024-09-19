import { Role } from '../entities/role.entity';

export interface RoleRepositoryPort {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  create(role: Role): Promise<Role>;
  update(id: string, role: Partial<Role>): Promise<Role | null>;
  delete(id: string): Promise<boolean>;
}
