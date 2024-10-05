// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseAttributeTypeRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-attribute-type-repository.adapter';

@Module({
  providers: [
    {
      provide: 'AttributeTypeRepositoryPort',
      useClass: MongooseAttributeTypeRepositoryAdapter,
    },
  ],
  controllers: [],
  exports: [],
})
export class AttributeTypeModule {}
