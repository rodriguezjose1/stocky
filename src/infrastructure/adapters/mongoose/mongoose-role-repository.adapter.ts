// infrastructure/adapters/mongoose-role-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Role } from '../../../domain/entities/role.entity';
import { RoleRepositoryPort } from '../../../domain/ports/role-repository.port';
import { RoleModel, RoleSchema } from '../../models/role.model';

@Injectable()
export class MongooseRoleRepositoryAdapter implements RoleRepositoryPort {
  private roleModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.roleModel = this.connection.model(RoleModel.name, RoleSchema);
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.roleModel.find().exec();
    return roles.map((role) => this.mapToEntity(role));
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.roleModel.findById(id).exec();
    return role ? this.mapToEntity(role) : null;
  }

  async create(role: Role): Promise<Role> {
    const newRole = new this.roleModel(this.mapToModel(role));
    const savedRole = await newRole.save();
    return this.mapToEntity(savedRole);
  }

  async update(id: string, role: Partial<Role>): Promise<Role | null> {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, this.mapToModel(role), { new: true })
      .exec();
    return updatedRole ? this.mapToEntity(updatedRole) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.roleModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  private mapToEntity(roleModel: RoleModel): Role {
    return new Role(
      roleModel._id.toString(),
      roleModel.name,
      roleModel.description,
      roleModel.permissions,
    );
  }

  private mapToModel(role: Partial<Role>): Partial<RoleModel> {
    return {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    };
  }
}
