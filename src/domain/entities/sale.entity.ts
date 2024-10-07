export enum SaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class SaleDetail {
  constructor(
    public productId: string,
    public variantId: string,
    public quantity: number,
  ) {}
}

export class StocksUpdated {
  constructor(
    public stock: string,
    public quantity: number,
    public costPrice: number,
  ) {}
}

export class Sale {
  constructor(
    public id: string,
    public date: Date,
    public status: SaleStatus,
    public details: SaleDetail[],
    public stocksUpdated: StocksUpdated[],
  ) {}
}
