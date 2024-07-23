// interfaces/http/purchase.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { PurchasesUseCase } from '../../application/use-cases/purchase.use-cases';

@Controller('purchases')
export class PurchaseController {
  constructor(private purchaseUseCases: PurchasesUseCase) {}

  @Post()
  async createPurchase(
    @Body()
    purchaseData: {
      date: string;
      details: { product_id: string; quantity: number; unit_price: number }[];
    },
  ) {
    const purchase = await this.purchaseUseCases.createPurchase(purchaseData);

    return {
      purchase,
    };
  }

  @Get()
  async getAllPurchases() {
    const purchases = await this.purchaseUseCases.findAll();

    return {
      purchases,
    };
  }
}
