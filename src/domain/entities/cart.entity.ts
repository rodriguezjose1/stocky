export class CartItem {
  constructor(
    public id: string,
    public product: any,
    public variant: any,
    public quantity: number,
  ) {}
}

// similar to schema
export class Cart {
  constructor(
    public id: string,
    public userId: string,
    public items: any[],
    public total: number,
  ) {}
}

export class AddProductToCartDTO {
  constructor(
    public cartId: string,
    public productId: string,
    public variantId: string,
    public quantity: number,
  ) {}
}

export class CreateCartDTO {
  constructor(public userId: string) {}
}
