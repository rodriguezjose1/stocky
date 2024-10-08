export enum SaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class Prices {
  constructor(
    public cost?: number,
    public retail?: number,
    public reseller?: number,
  ) {}
}

export class SaleDetail {
  constructor(
    public productId: string,
    public variantId: string,
    public quantity: number,
    public prices: Prices,
  ) {}
}

export class StocksUpdated {
  constructor(
    public stock: string,
    public quantity: number,
    public prices: Prices,
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
