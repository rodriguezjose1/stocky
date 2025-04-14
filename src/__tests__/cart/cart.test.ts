import { TEST_DATA, TestContext, cleanupTestModule, logAfterEach, setupBeforeEach, setupTestModule } from '../wholesale/test-setup';
import { Types } from 'mongoose';
import { User } from '../../domain/entities/user.entity';

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
});