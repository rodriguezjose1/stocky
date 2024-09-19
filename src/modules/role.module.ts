// role.module.ts
import { Module } from '@nestjs/common';
import { MongooseRoleRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-role-repository.adapter';

@Module({
  providers: [
    {
      provide: 'RoleRepositoryPort',
      useClass: MongooseRoleRepositoryAdapter,
    },
  ],
  exports: [],
})
export class RoleModule {}
