import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { PriceHistory } from '../../../domain/entities/price-history.entity';
import { PriceHistoryRepositoryPort } from '../../../domain/ports/pirce-history.port';
import { PriceHistoryModel, PriceHistorySchema } from '../../models/price-history.model';

@Injectable()
export class MongoosePriceHistoryRepositoryAdapter implements PriceHistoryRepositoryPort {
  private priceHistoryModel: Model<any>;

  constructor(@InjectConnection() private connection: Connection) {
    this.priceHistoryModel = this.connection.model(PriceHistoryModel.name, PriceHistorySchema);
  }

  async findAll(): Promise<PriceHistory[]> {
    const histories = await this.priceHistoryModel.find().exec();
    return histories.map((history) => this.mapToEntity(history));
  }

  async findByProductId(productId: string): Promise<PriceHistory[]> {
    const histories = await this.priceHistoryModel.find({ productId }).exec();
    return histories.map((history) => this.mapToEntity(history));
  }

  async create(priceHistory: PriceHistory): Promise<PriceHistory> {
    const newPriceHistory = new this.priceHistoryModel(this.mapToModel(priceHistory));
    const savedHistory = await newPriceHistory.save();
    return this.mapToEntity(savedHistory);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.priceHistoryModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  private mapToEntity(priceHistoryModel: PriceHistoryModel): PriceHistory {
    return new PriceHistory(
      priceHistoryModel._id.toString(),
      priceHistoryModel.productId.toString(),
      priceHistoryModel.previousPrice,
      priceHistoryModel.newPrice,
      priceHistoryModel.modifiedAt,
      priceHistoryModel.modifiedBy.toString(),
      priceHistoryModel.comments,
    );
  }

  private mapToModel(priceHistory: Partial<PriceHistory>): Partial<PriceHistoryModel> {
    return {
      productId: new Types.ObjectId(priceHistory.productId),
      previousPrice: priceHistory.previousPrice,
      newPrice: priceHistory.newPrice,
      modifiedAt: priceHistory.modifiedAt,
      modifiedBy: new Types.ObjectId(priceHistory.modifiedBy),
      comments: priceHistory.comments,
    };
  }
}
