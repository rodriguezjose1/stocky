// domain/entities/purchase.entity.ts
export class PurchaseDetail {
  constructor(
    public product_id: string,
    public quantity: number,
    public unit_price: number,
  ) {}
}

export class Purchase {
  constructor(
    public id: string,
    public date: Date,
    public details: PurchaseDetail[],
  ) {}
}
