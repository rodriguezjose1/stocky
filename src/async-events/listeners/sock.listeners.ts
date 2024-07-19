import { OnEvent } from '@nestjs/event-emitter';
import { StockCreatedEvent } from '../events/stock.events';

export class StockListener {
  @OnEvent('stock.created')
  handleStockCreated(event: StockCreatedEvent) {
    console.log('Stock created:', event.stockId);
    // Lógica adicional aquí
  }
}
