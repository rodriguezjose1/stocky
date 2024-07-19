export class StockCreatedEvent {
  constructor(public readonly stockId: string) {}
}

export class StockUpdatedEvent {
  constructor(public readonly stockId: string) {}
}

export class StockDeletedEvent {
  constructor(public readonly stockId: string) {}
}
