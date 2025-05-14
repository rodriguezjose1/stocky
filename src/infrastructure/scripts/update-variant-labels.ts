import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class UpdateVariantLabelsMigration {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async up(): Promise<void> {
    const variantCollection = this.connection.collection('variants');
    const productAttributeCollection = this.connection.collection('productattributes');

    // Obtener todas las variantes
    const variants = await variantCollection.find({ size_label: null }).toArray();

    for (const variant of variants) {
      const updates: any = {};

      // Buscar y actualizar color_label
      if (variant.color) {
        const colorAttribute = await productAttributeCollection.findOne({
          type: 'color',
          value: variant.color
        });

        if (colorAttribute) {
          updates.color_label = colorAttribute.label;
        } else {
          // Si no encuentra por value, buscar por label
          const colorByLabel = await productAttributeCollection.findOne({
            type: 'color',
            label: variant.color
          });
          if (colorByLabel) {
            updates.color_label = colorByLabel.label;
          }
        }
      }

      // Buscar y actualizar size_label
      if (variant.size) {
        const sizeAttribute = await productAttributeCollection.findOne({
          type: 'size',
          value: variant.size.toLowerCase()
        });

        if (sizeAttribute) {
          if (sizeAttribute.label) {
            updates.size_label = sizeAttribute.label;
          } else {
            updates.size_label = sizeAttribute.value;
          }
        } else {
          // Si no encuentra por value, buscar por label
          const sizeByLabel = await productAttributeCollection.findOne({
            type: 'size',
            label: variant.size
          });
          if (sizeByLabel) {
            updates.size_label = sizeByLabel.label;
          }
        }
      }

      // Actualizar la variante si hay cambios
      if (Object.keys(updates).length > 0) {
        await variantCollection.updateOne(
          { _id: variant._id },
          { $set: updates }
        );
        console.log(`Updated variant ${variant._id} with labels:`, updates);
      }
    }
  }

  async down(): Promise<void> {
    const variantCollection = this.connection.collection('variants');
    
    // Eliminar los campos color_label y size_label
    await variantCollection.updateMany(
      {},
      { $unset: { color_label: "", size_label: "" } }
    );
  }
} 