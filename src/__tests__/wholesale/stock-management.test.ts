import { createCipheriv } from 'crypto';
import { UpdateStockDto } from '../../domain/entities/stock.entity';
import { TEST_DATA, TestContext, setupTestModule, cleanupTestModule, setupBeforeEach, logAfterEach } from './test-setup';

describe('Wholesale Stock Management', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestModule();
  }, 120000);

  afterAll(async () => {
    await cleanupTestModule(context);
  }, 30000);

  beforeEach(async () => {
    await setupBeforeEach(context);
  });

  afterEach(async () => {
    await logAfterEach(context);
  });

  it('should add stock to the product', async () => {
    // Crear un producto para este test específico
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
    const productId = createdProduct.id;

    const stockDto: UpdateStockDto[] = [
      {
        product: productId,
        variant: {
          id: TEST_DATA.variant._id.toString(),
          color: [TEST_DATA.variant.color],
          size: [TEST_DATA.variant.size],
        },
        quantity: TEST_DATA.stock.quantity,
        costPrice: TEST_DATA.stock.costPrice,
        date: new Date(),
      },
    ];

    const createdStock = await context.stockUseCases.createStockMultiple(stockDto);
    expect(createdStock).toBeDefined();
    expect(createdStock.length).toBe(1);
    expect(createdStock[0].quantity).toBe(TEST_DATA.stock.quantity);
  });

  it('should verify stock quantity', async () => {
    // Crear un producto para este test específico
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
    const productId = createdProduct.id;

    // Crear stock para este test específico
    const stockDto: UpdateStockDto[] = [
      {
        product: productId,
        variant: {
          id: TEST_DATA.variant._id.toString(),
          color: [TEST_DATA.variant.color],
          size: [TEST_DATA.variant.size],
        },
        quantity: TEST_DATA.stock.quantity,
        costPrice: TEST_DATA.stock.costPrice,
        date: new Date(),
      },
    ];

    const createdStock = await context.stockUseCases.createStockMultiple(stockDto);
    // const stockId = createdStock[0].id;

    // const stock = await context.stockUseCases.getStockById(stockId);
    const quantity = await context.stockUseCases.getQuantityByVariantId(productId, createdStock[0].variant);
    expect(quantity).toBe(TEST_DATA.stock.quantity);
  });

  it('should decrement stock after a sale', async () => {
    // Crear un producto para este test específico
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
    const productId = createdProduct.id;

    // Crear stock para este test específico
    const stockDto: UpdateStockDto[] = [
      {
        product: productId,
        variant: {
          id: TEST_DATA.variant._id.toString(),
          color: [TEST_DATA.variant.color],
          size: [TEST_DATA.variant.size],
        },
        quantity: TEST_DATA.stock.quantity,
        costPrice: TEST_DATA.stock.costPrice,
        date: new Date(),
      },
    ];

    const createdStock = await context.stockUseCases.createStockMultiple(stockDto);

    const decrementAmount = 20;
    const decrementedStocks = await context.stockUseCases.decrementStock(
      productId, 
      createdStock[0].variant, 
      { quantity: decrementAmount }
    );
    const quantity = await context.stockUseCases.getQuantityByVariantId(productId, createdStock[0].variant);
    
    expect(decrementedStocks).toBeDefined();
    expect(decrementedStocks[0].quantity).toBe(decrementAmount);
    expect(quantity).toBe(TEST_DATA.stock.quantity - decrementAmount);
  });

  it('should fail when trying to decrement more stock than available', async () => {
    // Crear un producto para este test específico
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
    const productId = createdProduct.id;

    // Crear stock para este test específico
    const stockDto: UpdateStockDto[] = [
      {
        product: productId,
        variant: {
          id: TEST_DATA.variant._id.toString(),
          color: [TEST_DATA.variant.color],
          size: [TEST_DATA.variant.size],
        },
        quantity: TEST_DATA.stock.quantity,
        costPrice: TEST_DATA.stock.costPrice,
        date: new Date(),
      },
    ];

    const createdStock = await context.stockUseCases.createStockMultiple(stockDto);
    const stockId = TEST_DATA.variant._id.toString();

    const decrementAmount = TEST_DATA.stock.quantity + 1;
    await expect(
      context.stockUseCases.decrementStock(productId, stockId, { quantity: decrementAmount })
    ).rejects.toThrow();
  });
}); 