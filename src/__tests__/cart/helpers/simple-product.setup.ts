import { TestContext } from '../../wholesale/test-setup';
import { User } from '../../../domain/entities/user.entity';
import { Types } from 'mongoose';

export interface SimpleProductSetup {
  cart: any;
  cartWithProduct: any;
  productId: string;
  variantId: string;
}

export async function setupSimpleProduct(
  context: TestContext,
  user: User,
  initialQuantity: number
): Promise<SimpleProductSetup> {
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
    code: 'TEST_CAT',
    active: true,
    sizeTypes: [sizeType.id]
  });

  // Crear producto simple
  const productDto = {
    id: new Types.ObjectId().toString(),
    name: 'Simple Product',
    description: 'A simple product for testing',
    code: 'SP001',
    categories: [category.id],
    attributes: {
      brand: 'Test Brand',
      material: 'Test Material',
      origin: 'Test Origin'
    },
    pictures: [],
    prices: {
      cost: 1000,
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
      isWholesaler: false,
      packageType: "simple" as const
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
    costPrice: 50,
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
    quantity: initialQuantity
  };
  
  const cartWithProduct: any = await context.cartUseCases.addProductToCart(addProductDto);
  
  // Verificar que la preparación fue exitosa
  // expect(cartWithProduct.items).toHaveLength(1);
  // expect(cartWithProduct.items[0].quantity).toBe(initialQuantity);
  
  return {
    cart,
    cartWithProduct,
    productId,
    variantId
  };
} 