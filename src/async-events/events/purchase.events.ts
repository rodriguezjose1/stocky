export class PurchaseCreatedEvent {
  constructor(public readonly purchaseId: string) {}
}

export class PurchaseUpdatedEvent {
  constructor(public readonly purchaseId: string) {}
}

export class PurchaseDeletedEvent {
  constructor(public readonly purchaseId: string) {}
}
