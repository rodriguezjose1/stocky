import { TEST_DATA, TestContext, cleanupTestModule, logAfterEach, setupBeforeEach, setupTestModule } from '../wholesale/test-setup';
import { Types } from 'mongoose';
import { User } from '../../domain/entities/user.entity';
import { setupCartWithProductForEditQuantity } from './helpers/edit-quantity.setup';
import { setupSimpleProduct } from './helpers/simple-product.setup';
import { setupCompositeProduct } from './helpers/composite-product.setup';

describe('Cart Management', () => {
  let context: TestContext;
  let productId: string;
  let variantId: string;
  let user: User;

  beforeAll(async () => {
    context = await setupTestModule();
  }, 120000);

  afterAll(async () => {
    await cleanupTestModule(context);
  }, 30000);

  beforeEach(async () => {
    await setupBeforeEach(context);

    // Create user with a new ObjectId
    user = await context.userUseCases.createUser({
      ...TEST_DATA.user,
      id: new Types.ObjectId().toString(),
      email: `test${Date.now()}@example.com`
    });

    // Create product with stock
    const productDto = {
      id: TEST_DATA.product._id.toString(),
      name: TEST_DATA.product.name,
      description: TEST_DATA.product.description,
      code: TEST_DATA.product.code,
      categories: TEST_DATA.product.categories,
      attributes: TEST_DATA.product.attributes,
      pictures: TEST_DATA.product.pictures,
      prices: TEST_DATA.product.prices,
      percentages: TEST_DATA.product.percentages,
      sizeType: TEST_DATA.product.size_type,
      sizes: TEST_DATA.product.sizes,
      colors: TEST_DATA.product.colors,
      wholesaleData: {
        isWholesaler: false,
        packageType: "simple" as const
      },
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    productId = createdProduct.id;
    
    // Add stock to product
    const stockDto = [{
      product: productId,
      variant: {
        id: new Types.ObjectId().toString(),
        color: [TEST_DATA.variant.color],
        size: [TEST_DATA.variant.size],
      },
      quantity: TEST_DATA.stock.quantity,
      costPrice: TEST_DATA.stock.costPrice,
      date: new Date(),
    }];
    

    const stock = await context.stockUseCases.createStockMultiple(stockDto);
    variantId = stock[0].variant.toString();
  });

  afterEach(async () => {
    // Delete the user after each test
    if (user?.id) {
      await context.userUseCases.deleteUser(user.id);
    }
    await logAfterEach(context);
  });

  it('should create a cart', async () => {
    const cart = await context.cartUseCases.createCart(user);
    
    expect(cart).toBeDefined();
    expect(cart.userId.toString()).toBe(user.id);
    expect(cart.items).toHaveLength(0);
  });

  it('should add a product to cart', async () => {
    // Create cart
    const cart = await context.cartUseCases.createCart(user);

    // Add product to cart
    const addProductDto = {
      cartId: cart.id,
      productId: productId,
      variantId: variantId,
      quantity: 2
    };

    const updatedCart: any = await context.cartUseCases.addProductToCart(addProductDto);

    console.log(updatedCart);

    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].product.id).toBe(productId);
    expect(updatedCart.items[0].quantity).toBe(2);
    expect(updatedCart.total_reseller).toBeGreaterThan(0);
    expect(updatedCart.total_retail).toBeGreaterThan(0);
    expect(updatedCart.total_wholesale).toBe(0);
  });

  it('should update product quantity in cart', async () => {
    // Create cart
    const cart = await context.cartUseCases.createCart(user);

    // Add product to cart
    const addProductDto = {
      cartId: cart.id,
      productId: productId,
      variantId: variantId,
      quantity: 2
    };

    const cartWithProduct: any = await context.cartUseCases.addProductToCart(addProductDto);

    // Update quantity
    const updatedCart: any  = await context.cartUseCases.updateProductQuantity(
      cart.id,
      productId,
      variantId,
      3,
      false,
      0
    );

    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].quantity).toBe(3);
    expect(updatedCart.total_reseller).toBeGreaterThan(cartWithProduct.total_reseller);
    expect(updatedCart.total_retail).toBeGreaterThan(cartWithProduct.total_retail);
    expect(updatedCart.total_wholesale).toBe(cartWithProduct.total_wholesale);
  });

  it('should remove product from cart', async () => {
    // Create cart
    const cart = await context.cartUseCases.createCart(user);

    // Add product to cart
    const addProductDto = {
      cartId: cart.id,
      productId: productId,
      variantId: variantId,
      quantity: 2
    };

    await context.cartUseCases.addProductToCart(addProductDto);

    // Remove product
    const updatedCart: any = await context.cartUseCases.removeProductFromCart(
      cart.id,
      variantId,
      productId,
      false
    );

    expect(updatedCart.items).toHaveLength(0);
    expect(updatedCart.total_reseller).toBe(0);
    expect(updatedCart.total_retail).toBe(0);
    expect(updatedCart.total_wholesale).toBe(0);
  });

  it('should edit product quantity in cart', async () => {
    // Preparación usando el helper específico
    const { cart, cartWithProduct } = await setupCartWithProductForEditQuantity(
      context,
      user,
      productId,
      variantId,
      2 // cantidad inicial
    );
    
    // TEST: Editar la cantidad del producto
    const newQuantity = 5;
    const updatedCart: any = await context.cartUseCases.updateProductQuantity(
      cart.id,
      productId,
      variantId,
      newQuantity,
      false,
      0
    );
    
    // Verificaciones del test
    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].quantity).toBe(newQuantity);
    expect(updatedCart.total_reseller).toBeGreaterThan(cartWithProduct.total_reseller);
    expect(updatedCart.total_retail).toBeGreaterThan(cartWithProduct.total_retail);
    expect(updatedCart.total_wholesale).toBe(cartWithProduct.total_wholesale);
    
    // Verificar que los totales se actualizaron proporcionalmente
    const expectedTotalRatio = newQuantity / cartWithProduct.items[0].quantity;
    const actualTotalRatio = updatedCart.total_retail / cartWithProduct.total_retail;
    expect(actualTotalRatio).toBeCloseTo(expectedTotalRatio, 2);
  });

  it('should edit quantity of a simple product in cart', async () => {
    // Preparación usando el helper específico para productos simples
    const { cart, cartWithProduct, productId, variantId } = await setupSimpleProduct(
      context,
      user,
      2 // cantidad inicial
    );
    
    // TEST: Editar la cantidad del producto
    const newQuantity = 5;
    const updatedCart: any = await context.cartUseCases.updateProductQuantity(
      cart.id,
      productId,
      variantId,
      newQuantity,
      false,
      0
    );
    
    // Verificaciones del test
    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].quantity).toBe(newQuantity);
    expect(updatedCart.total_reseller).toBeGreaterThan(cartWithProduct.total_reseller);
    expect(updatedCart.total_retail).toBeGreaterThan(cartWithProduct.total_retail);
    expect(updatedCart.total_wholesale).toBe(cartWithProduct.total_wholesale);
    
    // Verificar que los totales se actualizaron proporcionalmente
    const expectedTotalRatio = newQuantity / cartWithProduct.items[0].quantity;
    const actualTotalRatio = updatedCart.total_retail / cartWithProduct.total_retail;
    expect(actualTotalRatio).toBeCloseTo(expectedTotalRatio, 2);
  });

  it('should edit quantity of a composite product in cart', async () => {
    // Preparación usando el helper específico para productos compuestos
    const { cart, cartWithProduct, productId, variantId } = await setupCompositeProduct(
      context,
      user,
      2 // cantidad inicial
    );
    
    // TEST: Editar la cantidad del producto compuesto
    const newQuantity = 3;
    const updatedCart: any = await context.cartUseCases.updateProductQuantity(
      cart.id,
      productId,
      variantId,
      newQuantity,
      true, // isWholesalePackage
      6 // predefinedQuantity
    );
    
    // Verificaciones del test
    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].quantity).toBe(newQuantity);
    expect(updatedCart.items[0].is_wholesale_package).toBe(true);
    expect(updatedCart.items[0].predefined_quantity).toBe(6);
    
    // Verificar que los totales se actualizaron proporcionalmente
    const expectedTotalRatio = newQuantity / cartWithProduct.items[0].quantity;
    const actualTotalRatio = updatedCart.total_wholesale / cartWithProduct.total_wholesale;
    expect(actualTotalRatio).toBeCloseTo(expectedTotalRatio, 2);
    
    // Verificar la estructura del producto
    const cartItem = updatedCart.items[0];
    expect(cartItem.product).toBeDefined();
    expect(cartItem.product.wholesale_data).toBeDefined();
    expect(cartItem.product.wholesale_data.package_type).toBe('complex');
    expect(cartItem.wholesale_variants).toBeDefined();
    expect(cartItem.wholesale_variants).toHaveLength(1);
    expect(cartItem.wholesale_variants[0].quantity).toBe(3);
  });
});