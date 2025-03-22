import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementType } from '../../../domain/entities/stock-movement.entity';
import { StockMovementRepositoryPort } from '../../../domain/ports/stock-movement-repository.port';

@Injectable()
export class MongooseStockMovementRepositoryAdapter implements StockMovementRepositoryPort {
  constructor(
    @InjectModel('StockMovement')
    private readonly stockMovementModel: Model<StockMovement>,
  ) {}

  async create(movement: StockMovement): Promise<StockMovement> {
    const createdMovement = new this.stockMovementModel(movement);
    return createdMovement.save();
  }

  async findByProductId(productId: string): Promise<StockMovement[]> {
    return this.stockMovementModel.find({ productId }).sort({ date: -1 }).exec();
  }

  async findByVariantId(variantId: string): Promise<StockMovement[]> {
    return this.stockMovementModel.find({ variantId }).sort({ date: -1 }).exec();
  }

  async findByProductIdAndVariantId(productId: string, variantId: string): Promise<StockMovement[]> {
    return this.stockMovementModel
      .find({ productId, variantId })
      .sort({ date: -1 })
      .exec();
  }

  async findById(id: string): Promise<StockMovement | null> {
    return this.stockMovementModel.findById(id).exec();
  }
} 