export enum SaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class SaleDetail {
  constructor(
    public product_id: string,
    public variant_id: string,
    public quantity: number,
    public unit_price: number,
  ) {}
}

export class Sale {
  constructor(
    public id: string,
    public date: Date,
    public status: SaleStatus,
    public details: SaleDetail[],
  ) {}
}
