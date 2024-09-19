// infrastructure/adapters/mongoose-purchase-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import {
  Purchase,
  PurchaseDetail,
} from '../../../domain/entities/purchase.entity';
import { PurchaseRepositoryPort } from '../../../domain/ports/purchase-repository.port';
import { PurchaseModel, PurchaseSchema } from '../../models/purchase.model';

@Injectable()
export class MongoosePurchaseRepositoryAdapter
  implements PurchaseRepositoryPort
{
  private purchaseModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.purchaseModel = this.connection.model(
      PurchaseModel.name,
      PurchaseSchema,
    );
  }

  async create(purchase: Purchase): Promise<Purchase> {
    const createdPurchase = new this.purchaseModel(purchase);
    const savedPurchase = await createdPurchase.save();
    return this.mapToDomain(savedPurchase);
  }

  async findAll(): Promise<Purchase[]> {
    const purchases = await this.purchaseModel.find().exec();
    return purchases.map((purchase) => this.mapToDomain(purchase));
  }

  async findById(id: string): Promise<Purchase | null> {
    const purchase = await this.purchaseModel.findById(id).exec();
    return purchase ? this.mapToDomain(purchase) : null;
  }

  private mapToDomain(purchaseModel: PurchaseModel): Purchase {
    return new Purchase(
      purchaseModel._id.toString(),
      purchaseModel.date,
      purchaseModel.details.map(
        (detail) =>
          new PurchaseDetail(
            detail.product_id.toString(),
            detail.quantity,
            detail.unit_price,
          ),
      ),
    );
  }
}
