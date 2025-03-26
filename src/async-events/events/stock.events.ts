export class StockCreatedEvent {
  constructor(public readonly stockId: string) {}
}

export class StockIncrementedEvent {
  constructor(
    public readonly stockId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}

export class StockDecrementedEvent {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}
