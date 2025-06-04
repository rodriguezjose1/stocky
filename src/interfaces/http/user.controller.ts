// interfaces/http/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { UserUseCases } from '../../application/use-cases/user.use-cases';
import { ChangePasswordDto, GetResellersFilterDto, User } from '../../domain/entities/user.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/jwt-auth.guard';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';
import { ChangePasswordUseCases } from 'src/application/use-cases/change-password.use-cases';
import { Role } from 'src/domain/enums/role.enum';

@Controller('users')
export class UserController {
  constructor(
    private userUseCases: UserUseCases,
    private changePasswordUseCases: ChangePasswordUseCases,
  ) {}

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

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createUser(@Body() user: User) {
    const newUser = await this.userUseCases.createUser(user);

    return {
      user: newUser,
    };
  }

  @Post('customers')
  async createCustomer(@Body() user: User) {
    const newUser = await this.userUseCases.createUser(user, 'customer');

    return {
      user: newUser,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Put('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req) {
    const userId = req.user.id;
    await this.changePasswordUseCases.changePassword(userId, changePasswordDto);
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
