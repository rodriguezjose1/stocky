// interfaces/http/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { UserUseCases } from '../../application/use-cases/user.use-cases';
import { GetResellersFilterDto, User } from '../../domain/entities/user.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/jwt-auth.guard';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';

@Controller('users')
export class UserController {
  constructor(private userUseCases: UserUseCases) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllUsers() {
    const users = await this.userUseCases.getAllUsers();

    return {
      users,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('resellers')
  async findResellers(@Query() filter: GetResellersFilterDto) {
    const { resellers, total } = await this.userUseCases.findResellers(filter);
    return {
      resellers,
      total,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userUseCases.getUserById(id);

    return {
      user,
    };
  }

  @Post()
  async createUser(@Body() user: User) {
    const newUser = await this.userUseCases.createUser(user);

    return {
      user: newUser,
    };
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() user: Partial<User>) {
    const updatedUser = await this.userUseCases.updateUser(id, user);

    return {
      user: updatedUser,
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userUseCases.deleteUser(id);
  }
}
