import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockMovement, StockMovementStatus } from '../../models/stock-movement.model';
import { StockMovementRepositoryPort } from '../../../domain/ports/stock-movement-repository.port';
import { CreateStockMovementDto } from '../../../domain/dtos/stock-movement.dto';
import { StockMovement as StockMovementEntity } from '../../../domain/entities/stock-movement.entity';

@Injectable()
export class MongooseStockMovementRepositoryAdapter implements StockMovementRepositoryPort {
  constructor(
    @InjectModel(StockMovement.name)
    private readonly stockMovementModel: Model<StockMovement>,
  ) {}

  async create(movement: CreateStockMovementDto & { prices: any }): Promise<StockMovementEntity> {
    const modelData = StockMovement.mapToModel(movement);
    const newMovement = new this.stockMovementModel(modelData);
    const savedMovement = await newMovement.save();
    return savedMovement.mapToEntity();
  }

  async findByProduct(
    product_id: string,
    variant_id?: string,
  ): Promise<StockMovementEntity[]> {
    const query: any = { product_id: new Types.ObjectId(product_id) };
    if (variant_id) {
      query.variant_id = new Types.ObjectId(variant_id);
    }
    const movements = await this.stockMovementModel.find(query).exec();
    return movements.map(movement => movement.mapToEntity());
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<StockMovementEntity[]> {
    const movements = await this.stockMovementModel
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();
    return movements.map(movement => movement.mapToEntity());
  }

  async findByType(
    type: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovementEntity[]> {
    const query: any = { type };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    const movements = await this.stockMovementModel.find(query).exec();
    return movements.map(movement => movement.mapToEntity());
  }

  async findBySale(sale_id: string): Promise<StockMovementEntity[]> {
    const movements = await this.stockMovementModel
      .find({ sale_id: new Types.ObjectId(sale_id) })
      .exec();
    return movements.map(movement => movement.mapToEntity());
  }

  async findByClient(
    client_id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovementEntity[]> {
    const query: any = { client_id: new Types.ObjectId(client_id) };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    const movements = await this.stockMovementModel.find(query).exec();
    return movements.map(movement => movement.mapToEntity());
  }

  async getStockHistory(
    product_id: string,
    variant_id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovementEntity[]> {
    const query: any = {
      product_id: new Types.ObjectId(product_id),
      variant_id: new Types.ObjectId(variant_id),
    };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    const movements = await this.stockMovementModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
    return movements.map(movement => movement.mapToEntity());
  }

  async findById(id: string): Promise<StockMovementEntity | null> {
    const movement = await this.stockMovementModel
      .findById(new Types.ObjectId(id))
      .exec();
    return movement ? movement.mapToEntity() : null;
  }

  async update(
    id: string,
    movement: Partial<StockMovementEntity>,
  ): Promise<StockMovementEntity | null> {
    const modelData = StockMovement.mapToModel(movement);
    const updatedMovement = await this.stockMovementModel
      .findByIdAndUpdate(new Types.ObjectId(id), modelData, { new: true })
      .exec();
    return updatedMovement ? updatedMovement.mapToEntity() : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.stockMovementModel
      .findByIdAndDelete(new Types.ObjectId(id))
      .exec();
    return !!result;
  }

  async updateStatusBySaleId(saleId: string, status: StockMovementStatus): Promise<StockMovementEntity[]> {
    const updateData = StockMovement.mapToUpdateManyModel({ status });
    
    const result = await this.stockMovementModel
      .updateMany(
        { sale_id: new Types.ObjectId(saleId), status: StockMovementStatus.PENDING },
        updateData,
        { new: true }
      )
      .exec();

    return StockMovement.mapUpdateManyResultToEntities(result);
  }
} 