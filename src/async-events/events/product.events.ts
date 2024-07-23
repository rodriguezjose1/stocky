export class ProductCreatedEvent {
  constructor(public readonly productId: string) {}
}

export class ProductUpdatedEvent {
  constructor(public readonly productId: string) {}
}

export class ProductDeletedEvent {
  constructor(public readonly productId: string) {}
}
