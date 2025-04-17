import { TestContext } from '../../wholesale/test-setup';
import { User } from '../../../domain/entities/user.entity';
import { Types } from 'mongoose';

export interface CompositeProductSetup {
  cart: any;
  cartWithProduct: any;
  productId: string;
  variantId: string;
}

export async function setupCompositeProduct(
  context: TestContext,
  user: User,
  initialQuantity: number
): Promise<CompositeProductSetup> {
  // Crear product-attribute-subtype para tamaños
  const sizeType = await context.productAttributeSubtypeUseCases.createProductAttributeSubtype({
    type: 'size',
    label_type: 'Size',
    value: 'SIZE'
  });

  // Crear product-attributes para los tamaños
  const sizes = await Promise.all([
    context.productAttributeUseCases.createProductAttribute({
      label: 'Small',
      value: 'S',
      subtype: sizeType.id,
      type: 'size'
    }),
    context.productAttributeUseCases.createProductAttribute({
      label: 'Medium',
      value: 'M',
      subtype: sizeType.id,
      type: 'size'
    }),
    context.productAttributeUseCases.createProductAttribute({
      label: 'Large',
      value: 'L',
      subtype: sizeType.id,
      type: 'size'
    })
  ]);

  // Crear categoría
  const category = await context.categoryUseCases.createCategory({
    name: `Test Category ${Date.now()}`,
    code: `TEST_CAT_${Date.now()}`,
    active: true,
    sizeTypes: [sizeType.id]
  });

  // Crear producto compuesto
  const productDto = {
    id: new Types.ObjectId().toString(),
    name: 'Composite Product',
    description: 'A composite product for testing',
    code: 'CP001',
    categories: [category.id],
    attributes: {
      brand: 'Test Brand',
      material: 'Test Material',
      origin: 'Test Origin'
    },
    pictures: [],
    prices: {
      cost: 2000,
      retail: 0,
      reseller: 0,
      wholesale: {
        half_dozen: 0,
        dozen: 0
      }
    },
    percentages: {
      retail: 50,
      reseller: 30,
      wholesale: {
        half_dozen: 25,
        dozen: 20
      }
    },
    sizeType: sizeType.id,
    sizes: sizes.map(size => size.value),
    colors: [],
    wholesaleData: {
      isWholesaler: true,
      packageType: "complex" as const,
      wholesale_variants: []
    },
  };

  const createdProduct = await context.productUseCases.createProduct(productDto);
  const productId = createdProduct.id;
  
  // Agregar stock
  const stockDto = [{
    product: productId,
    variant: {
      id: new Types.ObjectId().toString(),
      color: ['Default'],
      size: [sizes[0].value],
    },
    quantity: 100,
    costPrice: 100,
    date: new Date(),
  }];

  const stock = await context.stockUseCases.createStockMultiple(stockDto);
  const variantId = stock[0].variant.toString();

  // Crear carrito y agregar producto
  const cart = await context.cartUseCases.createCart(user);
  
  const addProductDto = {
    cartId: cart.id,
    productId: productId,
    variantId: variantId,
    quantity: initialQuantity,
    isWholesalePackage: true,
    predefinedQuantity: 6
  };
  
  const cartWithProduct: any = await context.cartUseCases.addProductToCart(addProductDto);
  
  // Verificar que la preparación fue exitosa
  expect(cartWithProduct.items).toHaveLength(1);
  expect(cartWithProduct.items[0].quantity).toBe(initialQuantity);
  expect(cartWithProduct.items[0].is_wholesale_package).toBe(true);
  expect(cartWithProduct.items[0].predefined_quantity).toBe(6);
  
  return {
    cart,
    cartWithProduct,
    productId,
    variantId
  };
} 