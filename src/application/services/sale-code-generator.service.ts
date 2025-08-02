import { Injectable, Inject } from '@nestjs/common';
import { SaleRepositoryPort } from 'src/domain/ports/sale-repository.port';
import { generateSequentialSaleCode } from 'src/common/utils/sale-code.utils';

@Injectable()
export class SaleCodeGeneratorService {
  constructor(
    @Inject('SaleRepositoryPort')
    private saleRepository: SaleRepositoryPort,
  ) {}

  /**
   * Genera un código de venta único y secuencial
   * @returns Código de venta único con formato V-YYYY-NNNNNN
   */
  async generateUniqueSaleCode(): Promise<string> {
    // Obtener el último código de venta para generar el secuencial
    const lastSale = await this.saleRepository.findLastSale();
    return generateSequentialSaleCode(lastSale?.saleCode);
  }
} 