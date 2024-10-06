export class Stock {
  constructor(
    public id: string,
    public product: string,
    public variantId: string,
    public quantity: number,
    public costPrice: number,
    public date: Date,
    public productVariant?: Partial<Variant>[],
  ) {}
}

export class Variant {
  constructor(
    public attributeType: string,
    public attributeValue: string,
  ) {}
}

export class UpdateStockDto {
  constructor(
    public product: string,
    public variant: Variant[],
    public quantity: number,
    public costPrice: number,
    public date: Date,
  ) {}
}
