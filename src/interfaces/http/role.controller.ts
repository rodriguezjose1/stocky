// interfaces/http/Role.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { RoleUseCases } from '../../application/use-cases/role.use-cases';

@Controller('roles')
export class RoleController {
  constructor(private roleUseCases: RoleUseCases) {}

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllRoles() {
    const roles = await this.roleUseCases.getRoles();

    return {
      roles,
    };
  }
}
