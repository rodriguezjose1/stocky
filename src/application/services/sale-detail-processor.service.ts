import { Injectable } from '@nestjs/common';
import { Product } from 'src/domain/entities/product.entity';
import { SaleDetail } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { ProductUseCases } from '../use-cases/product.use-cases';
import { VariantUseCases } from '../use-cases/variant.use-cases';

@Injectable()
export class SaleDetailProcessorService {
  constructor(
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
  ) {}

  /**
   * Procesa los detalles de venta con precios y datos de variantes
   * @param cartItems - Items del carrito
   * @returns Array de detalles de venta procesados
   */
  async processSaleDetails(cartItems: any[]): Promise<SaleDetail[]> {
    const processedDetails: SaleDetail[] = [];
    
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const product: Product = await this.productUseCases.getProductById(item.product._id);
      
      if (!item.is_wholesale_package || (item.is_wholesale_package && !item.wholesale_variants.length)) {
        const variant: Variant = await this.variantUseCases.getVariantById(item.variant._id);
        
        // Para guest users, siempre usar precio RETAIL
        const prices = {
          retail: product.prices.retail,
          reseller: 0,
          wholesale: 0,
        };

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

        processedDetails[i] = new SaleDetail(
          item.product._id, 
          item.variant._id, 
          item.quantity, 
          prices, 
          variantData, 
          item.is_wholesale_package, 
          item.predefined_quantity, 
          item.wholesale_variants, 
          item.applied_price_type
        );
      } else {
        // Para paquetes mayoristas complejos
        const prices = {
          retail: 0,
          reseller: 0,
          wholesale: 0,
        };

        if (item.predefined_quantity === 6) {
          prices.wholesale = product.prices.wholesale.half_dozen;
        } else {
          prices.wholesale = product.prices.wholesale.dozen;
        }

        // Procesar variantes mayoristas
        const wholesaleVariantsData = await Promise.all(item.wholesale_variants.map(async (v: any) => {
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
                  label: v.variant.color_label,
                },
                {
                  name: 'size',
                  keyLabel: 'Talle',
                  value: v.variant.size,
                  label: v.variant.size_label,
                },
              ],
            },
            quantity: v.quantity,
          };
        }));

        processedDetails[i] = new SaleDetail(
          item.product._id, 
          null, 
          item.quantity, 
          prices, 
          null, 
          true, 
          item.predefined_quantity, 
          wholesaleVariantsData, 
          item.applied_price_type
        );
      }
    }

    return processedDetails;
  }

  /**
   * Crea los detalles de venta iniciales basados en el carrito
   * @param cartItems - Items del carrito
   * @returns Array de detalles de venta iniciales
   */
  createInitialSaleDetails(cartItems: any[]): SaleDetail[] {
    return cartItems.map((item) => {
      if (item.variant) {
        if (item.is_wholesale_package) {
          return new SaleDetail(
            item.product._id, 
            item.variant._id, 
            item.quantity, 
            null, 
            null, 
            true, 
            null, 
            [], 
            item.applied_price_type
          );
        } else {
          return new SaleDetail(
            item.product._id, 
            item.variant._id, 
            item.quantity, 
            null, 
            null, 
            false, 
            null, 
            [], 
            item.applied_price_type
          );
        }
      } else {
        return new SaleDetail(
          item.product._id, 
          null, 
          item.quantity, 
          null, 
          null, 
          true, 
          item.predefined_quantity, 
          item.wholesale_variants, 
          item.applied_price_type
        );
      }
    });
  }
} 