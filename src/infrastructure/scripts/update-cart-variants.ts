import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CartModel } from '../models/cart.model.model';
import { VariantModel, VariantSchema } from '../models/variant.model';

@Injectable()
export class UpdateCartVariantsScript {
  private variantModel: Model<any>;

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(CartModel.name) private readonly cartModel: Model<CartModel>,
  ) {
    this.variantModel = this.connection.model(VariantModel.name, VariantSchema);
  }

  async execute(): Promise<void> {
    try {
      // Buscar todos los carts activos
      const carts = await this.cartModel.find({ active: true }).exec();
      
      console.log(`Found ${carts.length} active carts to update`);

      let updatedCarts = 0;
      let skippedCarts = 0;
      let errorCarts = 0;
      
      for (const cart of carts) {
        try {
          let needsUpdate = false;
          
          // Procesar cada item en el cart
          for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];

            if (!item.product.prices.cost) {
              item.product.prices.cost = 0;
            }
            
            // Actualizar la variante principal si existe
            if (item.variant && item.variant._id) {
              // Buscar la variante completa en la base de datos
              const variant = await this.variantModel.findById(item.variant._id).exec();
              
              if (variant) {
                // Reemplazar la variante en el item con la variante completa
                item.variant = variant.toObject();
                needsUpdate = true;
              }
            }
            
            // Actualizar las variantes de wholesale si existen
            if (item.wholesale_variants && item.wholesale_variants.length > 0) {
              for (let j = 0; j < item.wholesale_variants.length; j++) {
                const wholesaleVariant = item.wholesale_variants[j];
                
                if (wholesaleVariant.variant && wholesaleVariant.variant._id) {
                  // Buscar la variante completa en la base de datos
                  const variant = await this.variantModel.findById(wholesaleVariant.variant._id).exec();
                  
                  if (variant) {
                    // Reemplazar la variante en el item con la variante completa
                    wholesaleVariant.variant = variant.toObject();
                    needsUpdate = true;
                  }
                }
              }
            }
          }
          
          // Guardar el cart si se realizaron cambios
          if (needsUpdate) {
            await cart.save();
            console.log(`Cart ${cart._id} actualizado correctamente`);
            updatedCarts++;
          } else {
            console.log(`Cart ${cart._id} no requiere actualización`);
            skippedCarts++;
          }
        } catch (error) {
          console.error(`Error al procesar cart ${cart._id}:`, error);
          errorCarts++;
        }
      }
      
      console.log('Update completed successfully');
      console.log(`Carts actualizados: ${updatedCarts}`);
      console.log(`Carts saltados: ${skippedCarts}`);
      console.log(`Carts con error: ${errorCarts}`);
    } catch (error) {
      console.error('Error updating carts:', error);
      throw error;
    }
  }
} 