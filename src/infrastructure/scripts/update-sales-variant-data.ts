import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AppliedPriceTypeEnum } from '../../domain/entities/sale.entity';
import { ProductAttributeModel, ProductAttributeSchema } from '../models/product-attribute.model';
import { ProductModel, ProductSchema } from '../models/product.model';
import { SaleModel } from '../models/sale.model';
import { StockModel, StockSchema } from '../models/stock.model';
import { VariantModel, VariantSchema } from '../models/variant.model';

@Injectable()
export class UpdateSalesVariantDataScript {
  private stockModel: Model<any>;
  private productModel: Model<any>;
  private variantModel: Model<any>;
  private productAttributeModel: Model<any>;

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(SaleModel.name) private readonly saleModel: Model<SaleModel>,
  ) {
    this.stockModel = this.connection.model(StockModel.name, StockSchema);
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
    this.variantModel = this.connection.model(VariantModel.name, VariantSchema);
    this.productAttributeModel = this.connection.model(ProductAttributeModel.name, ProductAttributeSchema);
  }

  async execute(): Promise<void> {
    try {
      // Buscar ventas que tienen stocks_updated pero no tienen variant_data o tienen variant_data incompleto
      const sales = await this.saleModel.find({
        stocks_updated: { $exists: true, $ne: [] },
        $or: [
          { 'stocks_updated.variant_data': { $exists: false } },
          { 'stocks_updated.variant_data': null },
          {
            $or: [
              { 'stocks_updated.variant_data.product_name': { $exists: false } },
              { 'stocks_updated.variant_data.product_code': { $exists: false } },
              { 'stocks_updated.variant_data.variant_id': { $exists: false } },
              { 'stocks_updated.variant_data.variant_attributes': { $exists: false } },
              { 'stocks_updated.variant_data.variant_attributes': { $size: 0 } }
            ]
          }
        ]
      }).exec();
      
      console.log(`Found ${sales.length} sales to update`);

      let updatedSales = 0;
      let skippedSales = 0;
      let errorSales = 0;
      
      for (const sale of sales) {
        try {
          let needsUpdate = false;
          
          // Procesar cada stock_updated en la venta
          for (let i = 0; i < sale.stocks_updated.length; i++) {
            const stockUpdated = sale.stocks_updated[i];
            
            // Verificar si ya tiene variant_data completo
            if (stockUpdated.variant_data && 
                stockUpdated.variant_data.product_name && 
                stockUpdated.variant_data.product_code && 
                stockUpdated.variant_data.variant_id && 
                stockUpdated.variant_data.variant_attributes && 
                stockUpdated.variant_data.variant_attributes.length > 0) {
              continue; // Ya tiene datos completos, saltar
            }
            
            // Obtener el stock para obtener información del producto y la variante
            const stock = await this.stockModel.findById(stockUpdated.stock).exec();
            
            if (!stock) {
              console.log(`Stock ${stockUpdated.stock} no encontrado para venta ${sale._id}, saltando...`);
              continue;
            }
            
            // Obtener el producto
            const product = await this.productModel.findById(stock.product).exec();
            
            if (!product) {
              console.log(`Producto ${stock.product} no encontrado para venta ${sale._id}, saltando...`);
              continue;
            }
            
            // Obtener la variante
            const variant = await this.variantModel.findById(stock.variant).exec();
            
            if (!variant) {
              console.log(`Variante ${stock.variant} no encontrada para venta ${sale._id}, saltando...`);
              continue;
            }
            
            // Obtener el atributo de color para obtener la etiqueta
            const colorAttribute = await this.productAttributeModel.findOne({ value: variant.color }).exec();
            const sizeAttribute = await this.productAttributeModel.findOne({ value: variant.size }).exec();
            
            // Crear los atributos de variante
            const variantAttributes = [
              {
                name: 'color',
                key_label: 'Color',
                value: variant.color,
                label: colorAttribute ? colorAttribute.label : variant.color
              },
              {
                name: 'size',
                key_label: 'Talle',
                value: variant.size,
                label: sizeAttribute ? sizeAttribute.label : variant.size
              }
            ];
            
            // Actualizar el variant_data en stocks_updated
            sale.stocks_updated[i].variant_data = {
              product_name: product.name,
              product_code: product.code,
              variant_id: stock.variant,
              variant_attributes: variantAttributes,
            };
            sale.stocks_updated[i].applied_price_type = AppliedPriceTypeEnum.RESELLER;
            
            needsUpdate = true;
          }
          
          // Guardar la venta si se realizaron cambios
          if (needsUpdate) {
            await sale.save();
            console.log(`Venta ${sale._id} actualizada correctamente`);
            updatedSales++;
          } else {
            console.log(`Venta ${sale._id} no requiere actualización`);
            skippedSales++;
          }
        } catch (error) {
          console.error(`Error al procesar venta ${sale._id}:`, error);
          errorSales++;
        }
      }
      
      console.log('Update completed successfully');
      console.log(`Ventas actualizadas: ${updatedSales}`);
      console.log(`Ventas saltadas: ${skippedSales}`);
      console.log(`Ventas con error: ${errorSales}`);
    } catch (error) {
      console.error('Error updating sales:', error);
      throw error;
    }
  }
} 