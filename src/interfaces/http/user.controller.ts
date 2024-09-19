// interfaces/http/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserUseCases } from '../../application/use-cases/user.use-cases';
import { User } from '../../domain/entities/user.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/jwt-auth.guard';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

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
    return this.userUseCases.updateUser(id, user);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userUseCases.deleteUser(id);
  }
}
