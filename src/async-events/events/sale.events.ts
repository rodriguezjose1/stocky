export class SaleCreatedEvent {
  constructor(public readonly saleId: string) {}
}

export class SaleUpdatedEvent {
  constructor(public readonly saleId: string) {}
}

export class SaleDeletedEvent {
  constructor(public readonly saleId: string) {}
}
