// application/use-cases/create-sale.use-case.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateSaleDto, Prices, Sale, SaleDetail, SaleStatus } from 'src/domain/entities/sale.entity';
import { SaleRepositoryPort } from '../../domain/ports/sale-repository.port';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SaleCreatedEvent, SaleUpdatedEvent } from 'src/async-events/events/sale.events';
import { StockUseCases } from './stock.use-cases';
import { ERROR_HANDLER_PORT, ErrorHandlerPort } from 'src/domain/ports/error-handler.port';
import { ProductUseCases } from './product.use-cases';
import { Product } from 'src/domain/entities/product.entity';
import { CartUseCases } from './cart.use-cases';
import { UserUseCases } from './user.use-cases';
import { VariantUseCases } from './variant.use-cases';
import { Variant } from 'src/domain/entities/variant.entity';
import { getWeekCode } from 'src/common/utils/date.utils';
import { Role } from 'src/domain/enums/role.enum';
import { ProductAttributeUseCases } from './product-attribute.use-cases';
import { ProductAttributeSubtypeUseCases } from './product-attribute-subtype.use-cases';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SalesUseCase {
  constructor(
    @Inject('SaleRepositoryPort')
    private saleRepository: SaleRepositoryPort,
    private eventEmitter: EventEmitter2,
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
    private stockUseCases: StockUseCases,
    private cartUseCases: CartUseCases,
    private userUseCases: UserUseCases,
    private productAttributeUseCases: ProductAttributeUseCases,
    private porductAttributeSubtypeUseCases: ProductAttributeSubtypeUseCases,
    @Inject(ERROR_HANDLER_PORT) private errorHandler: ErrorHandlerPort,
  ) { }

  async createSale(saleData: CreateSaleDto, userReq?: any) {
    try {
      if (saleData.cartId) {
        const cart = await this.cartUseCases.getCartById(saleData.cartId);
        if (cart.userId.toString() !== userReq.id) {
          throw new BadRequestException('Cart does not belong to user');
        }
        saleData.details = cart.items.map((item) => {
          if (item.variant) {
            if (item.is_wholesale_package) {
              return new SaleDetail(item.product._id, item.variant._id, item.quantity, null, null, true, null, [], item.applied_price_type);
            } else {
              return new SaleDetail(item.product._id, item.variant._id, item.quantity, null, null, false, null, [], item.applied_price_type);
            }
          } else {
            return new SaleDetail(item.product._id, null, item.quantity, null, null, true, item.predefined_quantity, item.wholesale_variants, item.applied_price_type);
          }
        });
      }

      await this.stockUseCases.checkStock(saleData.details);

      let prices: Prices;
      const details: SaleDetail[] = [];
      
      for (let i = 0; i < saleData.details.length; i++) {
        const detail = saleData.details[i];
        const product: Product = await this.productUseCases.getProductById(detail.productId);
        
        if (!detail.isWholesalePackage || (detail.isWholesalePackage && !detail.wholesaleVariants.length)) {
          const variant: Variant = await this.variantUseCases.getVariantById(detail.variantId);
          if (detail.isWholesalePackage) {
            prices = {
              retail: 0,
              reseller: 0,
              wholesale: detail.quantity === 6 ? product.prices.wholesale.half_dozen : product.prices.wholesale.dozen,
            };
          } else {
            prices = {
              retail: product.prices.retail,
              reseller: product.prices.reseller,
              wholesale: 0,
            };
          }
          const variantData = {
            productName: product.name,
            productCode: product.code,
            variantAttributes: [
              {
                name: 'color',
                keyLabel: 'Color',
                value: variant.color,
                label: variant.colorLabel,
              },
              {
                name: 'size',
                keyLabel: 'Talle',
                value: variant.size,
                label: variant.sizeLabel,
              },
            ],
          };
          details[i] = new SaleDetail(detail.productId, detail.variantId, detail.quantity, prices, variantData, detail.isWholesalePackage, detail.predefinedQuantity, detail.wholesaleVariants, detail.appliedPriceType);
        } else {
          prices = {
            retail: 0,
            reseller: 0,
          };
          if (detail.predefinedQuantity === 6) {
            prices.wholesale = product.prices.wholesale.half_dozen;
          } else {
            prices.wholesale = product.prices.wholesale.dozen;
          }

          // wholesale variants to variantData
          const wholesaleVariantsData = await Promise.all(detail.wholesaleVariants.map(async (v) => {
            const variant: Variant = await this.variantUseCases.getVariantById(v.variant._id);
            const productAttributeColor = await this.productAttributeUseCases.getProductAttributeByValue(variant.color.toLowerCase());
            const productAttributeSize = await this.productAttributeUseCases.getProductAttributeByValue(variant.size.toLowerCase());
            
            return {
              variant: {
                productName: product.name,
                productCode: product.code,
                variantId: v.variant._id,
                variantAttributes: [
                  {
                    name: 'color',
                    keyLabel: 'Color',
                    value: v.variant.color,
                    label: productAttributeColor.label,
                  },
                  {
                    name: 'size',
                    keyLabel: 'Talle',
                    value: v.variant.size,
                    label: productAttributeSize.label,
                  },
                ],
              },
              quantity: v.quantity,
            };
          }));

          details[i] = new SaleDetail(detail.productId, null, detail.quantity, prices, null, true, detail.predefinedQuantity, wholesaleVariantsData, detail.appliedPriceType);
        }
      }

      if (!saleData.user) {
        saleData.user = userReq.id;
        saleData.user = {
          id: userReq.id,
          name: userReq.name,
          lastname: userReq.lastname,
        };
      } else {
        const user = await this.userUseCases.getUserById(saleData.user as string);

        saleData.user = {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
        };
      }

      const weekCode = getWeekCode(new Date());
      const sale = new Sale(null, new Date(saleData.date), SaleStatus.PENDING, details, [], saleData.user, saleData.cartId, weekCode);

      const createdSale = await this.saleRepository.create(sale);

      this.eventEmitter.emit('sale.created', new SaleCreatedEvent(createdSale.id));

      return createdSale;
    } catch (error) {
      console.log(error);
      throw this.errorHandler.handleError(error);
    }
  }

  async findAll(filter): Promise<any> {
    if (this.isSellerNotAdmin(filter.user)) {
      filter.userId = filter.user.id;
    }
    return this.saleRepository.findAll(filter);
  }

  async findById(id: string): Promise<Sale | null> {
    const sale = await this.saleRepository.findById(id);
    return sale;
  }

  async deleteSale(id: string): Promise<boolean> {
    return this.saleRepository.delete(id);
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale | null> {
    const saleDB = await this.saleRepository.findById(id);
    if (!saleDB) throw new BadRequestException('Sale not found');

    const updatedSale = await this.saleRepository.update(id, sale);

    if (updatedSale && sale.status) this.handleSaleStatusChange(saleDB.status, sale.status, updatedSale.id);

    return updatedSale;
  }

  async findSellersWithSalesInCurrentWeek(): Promise<Sale[]> {
    return this.saleRepository.findSellersWithSalesInCurrentWeek();
  }

  async findProductsBySellerId(sellerId: string): Promise<any> {
    return this.saleRepository.findProductsBySellerId(sellerId);
  }

  async findGroupedProductsInCurrentWeek(): Promise<any> {
    return this.saleRepository.findGroupedProductsInCurrentWeek();
  }

  async getMonthlySalesStats(month?: number, year?: number): Promise<{
    totalSales: number;
    totalTransactions: number;
    totalCosts: number;
    totalProfit: number;
    totalProductsSold: number;
    averageSaleAmount: number;
    averageProfitPerTransaction: number;
  }> {
    return this.saleRepository.findMonthlySalesStats(month, year);
  }

  async processAsyncEvents(saleId: string): Promise<void> {
    this.eventEmitter.emit('sale.created', new SaleCreatedEvent(saleId));
  }

  private handleSaleStatusChange(prevStatus: SaleStatus, newStatus: SaleStatus, saleId: string): void {
    if (prevStatus === newStatus) return;
    const isNewStatusValid = newStatus !== SaleStatus.PENDING;

    if (isNewStatusValid) {
      this.eventEmitter.emit('sale.updated.status', new SaleUpdatedEvent(saleId));
    }
  }

  private isSellerNotAdmin(user): boolean {
    const roleNames = user.roles.map((role) => role.name);
    return roleNames.includes(Role.SELLER) && !roleNames.includes(Role.ADMIN);
  }

  async getMonthlySalesDetail(month?: number, year?: number): Promise<any[]> {
    return this.saleRepository.findMonthlySalesDetail(month, year);
  }

  async generateMonthlySalesExcel(month?: number, year?: number): Promise<any> {
    const sales = await this.saleRepository.findMonthlySalesDetail(month, year);
    
    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Ventas';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Agregar hoja de detalle de ventas
    const worksheet = workbook.addWorksheet('Detalle de Ventas');
    
    // Definir las columnas
    worksheet.columns = [
      { header: 'ID Venta', key: 'saleId', width: 15 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Producto', key: 'productName', width: 30 },
      { header: 'Código Producto', key: 'productCode', width: 15 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Talle', key: 'size', width: 10 },
      { header: 'Cantidad', key: 'quantity', width: 10 },
      { header: 'Tipo Precio', key: 'appliedPriceType', width: 15 },
      { header: 'Precio Unitario', key: 'unitPrice', width: 15 },
      { header: 'Costo Total', key: 'totalCost', width: 15 },
      { header: 'Venta Total', key: 'totalSale', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
      { header: 'Margen (%)', key: 'profitMargin', width: 15 },
      { header: 'Comprador', key: 'sellerName', width: 30 }
    ];
    
    // Agrupar ventas por saleId
    const groupedSales = sales.reduce((acc, sale) => {
      if (!acc[sale.saleId]) {
        acc[sale.saleId] = [];
      }
      acc[sale.saleId].push(sale);
      return acc;
    }, {});
    
    // Colores para alternar entre grupos de ventas
    const colors = ['FFFFFF', 'F5F5F5']; // Blanco y gris muy claro
    let colorIndex = 0;
    
    // Agregar los datos agrupados
    Object.values(groupedSales).forEach((saleGroup: any[]) => {
      const currentColor = colors[colorIndex];
      
      saleGroup.forEach(sale => {
        // Formatear el tipo de precio para que sea más legible
        const priceTypeMap = {
          'retail': 'Minorista',
          'reseller': 'Revendedor',
          'wholesale': 'Mayorista'
        };
        
        const formattedPriceType = priceTypeMap[sale.appliedPriceType] || sale.appliedPriceType;
        
        const row = worksheet.addRow({
          ...sale,
          date: new Date(sale.date).toLocaleDateString(),
          appliedPriceType: formattedPriceType,
          unitPrice: Number(sale.unitPrice).toFixed(2),
          totalCost: Number(sale.totalCost).toFixed(2),
          totalSale: Number(sale.totalSale).toFixed(2),
          profit: Number(sale.profit).toFixed(2),
          profitMargin: Number(sale.profitMargin).toFixed(2) + '%'
        });
        
        // Aplicar color de fondo a toda la fila
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: currentColor }
          };
        });
      });
      
      // Alternar color para el siguiente grupo
      colorIndex = (colorIndex + 1) % colors.length;
      
      // Agregar una fila de subtotal para cada grupo de venta
      const subtotalRow = worksheet.addRow({
        saleId: `Subtotal Venta ${saleGroup[0].saleId}`,
        quantity: saleGroup.reduce((sum, sale) => sum + sale.quantity, 0),
        totalCost: saleGroup.reduce((sum, sale) => sum + sale.totalCost, 0).toFixed(2),
        totalSale: saleGroup.reduce((sum, sale) => sum + sale.totalSale, 0).toFixed(2),
        profit: saleGroup.reduce((sum, sale) => sum + sale.profit, 0).toFixed(2),
        profitMargin: ((saleGroup.reduce((sum, sale) => sum + sale.profit, 0) / 
                       saleGroup.reduce((sum, sale) => sum + sale.totalCost, 0)) * 100).toFixed(2) + '%'
      });
      
      // Dar formato a la fila de subtotal
      subtotalRow.font = { bold: true };
      subtotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Agregar una fila en blanco entre grupos
      worksheet.addRow({});
    });
    
    // Dar formato a las columnas numéricas
    worksheet.getColumn('unitPrice').numFmt = '$#,##0.00';
    worksheet.getColumn('totalCost').numFmt = '$#,##0.00';
    worksheet.getColumn('totalSale').numFmt = '$#,##0.00';
    worksheet.getColumn('profit').numFmt = '$#,##0.00';
    worksheet.getColumn('profitMargin').numFmt = '0.00%';
    
    // Dar formato al encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Centrar los encabezados
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Agregar filtros a los encabezados
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length }
    };
    
    // Agregar totales al final
    const lastRow = worksheet.rowCount;
    const totalRow = worksheet.addRow({
      saleId: 'TOTALES',
      quantity: sales.reduce((sum, sale) => sum + sale.quantity, 0),
      totalCost: sales.reduce((sum, sale) => sum + sale.totalCost, 0).toFixed(2),
      totalSale: sales.reduce((sum, sale) => sum + sale.totalSale, 0).toFixed(2),
      profit: sales.reduce((sum, sale) => sum + sale.profit, 0).toFixed(2),
      profitMargin: (sales.reduce((sum, sale) => sum + sale.profit, 0) / 
                    sales.reduce((sum, sale) => sum + sale.totalCost, 0) * 100).toFixed(2) + '%'
    });
    
    // Dar formato a la fila de totales
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Agregar una hoja de resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    
    // Calcular estadísticas
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalSale, 0);
    const totalCosts = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalProducts = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const uniqueSales = [...new Set(sales.map(sale => sale.saleId))].length;
    const uniqueProducts = [...new Set(sales.map(sale => sale.productId))].length;
    const uniqueSellers = [...new Set(sales.map(sale => sale.sellerId))].length;
    
    // Agregar información al resumen
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 30 },
      { header: 'Valor', key: 'value', width: 20 }
    ];
    
    summarySheet.addRow({ metric: 'Período', value: `${month || new Date().getMonth() + 1}/${year || new Date().getFullYear()}` });
    summarySheet.addRow({ metric: 'Total de Ventas ($)', value: totalSales.toFixed(2) });
    summarySheet.addRow({ metric: 'Total de Costos ($)', value: totalCosts.toFixed(2) });
    summarySheet.addRow({ metric: 'Ganancia Total ($)', value: totalProfit.toFixed(2) });
    summarySheet.addRow({ metric: 'Margen de Ganancia (%)', value: (totalProfit / totalSales * 100).toFixed(2) + '%' });
    summarySheet.addRow({ metric: 'Productos Vendidos', value: totalProducts });
    summarySheet.addRow({ metric: 'Transacciones', value: uniqueSales });
    summarySheet.addRow({ metric: 'Productos Únicos', value: uniqueProducts });
    summarySheet.addRow({ metric: 'Vendedores', value: uniqueSellers });
    
    // Dar formato al resumen
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Generar el buffer del Excel
    return await workbook.xlsx.writeBuffer();
  }
}
