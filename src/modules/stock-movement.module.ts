import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovementUseCases } from '../application/use-cases/stock-movement.use-cases';
import { MongooseStockMovementRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-stock-movement-repository.adapter';
import { StockMovement, StockMovementSchema } from '../infrastructure/models/stock-movement.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockMovement.name, schema: StockMovementSchema }
    ])
  ],
  providers: [
    StockMovementUseCases,
    {
      provide: 'StockMovementRepositoryPort',
      useClass: MongooseStockMovementRepositoryAdapter,
    },
  ],
  exports: [StockMovementUseCases],
})
export class StockMovementModule {} 