import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../domain/entities/role.entity';
import { RoleRepositoryPort } from '../../domain/ports/role-repository.port';

@Injectable()
export class RoleUseCases {
  constructor(
    @Inject('RoleRepositoryPort')
    private RoleRepository: RoleRepositoryPort,
  ) {}

  async getRoles(): Promise<Role[]> {
    return this.RoleRepository.findAll();
  }

  async getRoleByName(name: string): Promise<Role> {
    return this.RoleRepository.findByName(name);
  }
}
