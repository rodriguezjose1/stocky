export interface PriceHistoryRepositoryPort {
  handleSaleCreated(): Promise<void>;
}
