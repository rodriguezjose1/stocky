// domain/entities/purchase.entity.ts
export class SaleDetail {
  constructor(
    public product_id: string,
    public quantity: number,
    public unit_price: number,
  ) {}
}

export class Sale {
  constructor(
    public id: string,
    public date: Date,
    public details: SaleDetail[],
  ) {}
}
