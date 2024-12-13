// infrastructure/adapters/mongoose-user-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User } from '../../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { UserModel, UserSchema } from '../../models/user.model';
import { Role } from 'src/domain/enums/role.enum';
import { RoleModel, RoleSchema } from 'src/infrastructure/models/role.model';

@Injectable()
export class MongooseUserRepositoryAdapter implements UserRepositoryPort {
  private userModel = Model<any>;
  private roleModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.userModel = this.connection.model(UserModel.name, UserSchema);
    this.roleModel = this.connection.model(RoleModel.name, RoleSchema);
  }

  async create(user: User): Promise<User> {
    user.email = user.email.toLowerCase().trim();
    const createdUser = new this.userModel(user);
    const savedUser = await createdUser.save();
    return this.mapToDomain(savedUser);
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users.map((user) => this.mapToDomain(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.mapToDomain(user) : null;
  }

  async findByEmailAuth(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email, active: true }).select('+password').populate({ path: 'roles' }).exec();
    return user ? this.mapToDomain(user) : null;
  }

  async findByIdAuth(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).select('+password').populate({ path: 'roles' }).exec();
    return user ? this.mapToDomain(user) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndUpdate({ _id: id }, { active: false }).exec();
    return result.updatedCount === 1;
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
    return updatedUser ? this.mapToDomain(updatedUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailParsed = email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: emailParsed }).exec();
    return user ? this.mapToDomain(user) : null;
  }

  async findOnlyRoleAdmins(): Promise<User[]> {
    const roleAdmin = await this.roleModel.findOne({ name: Role.ADMIN }).exec();
    if (!roleAdmin) {
      return [];
    }
    const users = await this.userModel.find({ roles: roleAdmin._id }).exec();
    return users.map((user) => this.mapToDomain(user));
  }

  async findResellers(filter): Promise<any> {
    const aggregate = [
      {
        $lookup: {
          from: 'roles',
          localField: 'roles',
          foreignField: '_id',
          as: 'roles',
        },
      },
      {
        $match: {
          'roles.name': Role.SELLER,
        },
      },
    ];
    const users = await this.userModel.aggregate([
      ...aggregate,
      { $skip: (filter.page - 1) * filter.limit },
      { $limit: filter.limit },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          password: 0,
        },
      },
    ]);

    const total = await this.userModel.aggregate([...aggregate, { $count: 'total' }]).exec();
    return {
      resellers: users.map((user) => this.mapToDomain(user)),
      total: total[0]?.total || 0,
    };
  }

  private mapToDomain(userModel: UserModel): User {
    return new User(
      userModel._id.toString(),
      userModel.name,
      userModel.lastname,
      userModel.password,
      userModel.email,
      userModel.roles.map((role: any) => {
        return {
          id: role._id.toString(),
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        };
      }),
      userModel.phone,
      userModel.birthdate,
      userModel.address,
      userModel.active,
      userModel.last_connection,
      userModel.dni,
    );
  }
}
