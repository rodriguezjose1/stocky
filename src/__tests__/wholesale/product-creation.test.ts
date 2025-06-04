import { CreateProductDto } from '../../domain/entities/product.entity';
import { roundUpTo100 } from '../../common/utils/math.utils';
import { TEST_DATA, TestContext, setupTestModule, cleanupTestModule, setupBeforeEach, logAfterEach } from './test-setup';

describe('Wholesale Product Creation', () => {
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

  it('should create a no wholesale product', async () => {
    const productDto: CreateProductDto = {
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
        packageType: 'simple'
      },
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    expect(createdProduct).toBeDefined();
    expect(createdProduct.name).toBe(TEST_DATA.product.name);
  });

  it('should create a wholesale product with simple package type', async () => {
    const productDto: CreateProductDto = {
      id: TEST_DATA.product._id.toString(),
      name: TEST_DATA.product.name,
      description: TEST_DATA.product.description,
      code: TEST_DATA.product.code,
      categories: TEST_DATA.product.categories,
      attributes: TEST_DATA.product.attributes,
      pictures: TEST_DATA.product.pictures,
      prices: {
        ...TEST_DATA.product.prices,
        wholesale: {
          half_dozen: 150,
          dozen: 120
        }
      },
      percentages: {
        ...TEST_DATA.product.percentages,
        wholesale: {
          half_dozen: 55,
          dozen: 20
        }
      },
      sizeType: TEST_DATA.product.size_type,
      sizes: TEST_DATA.product.sizes,
      colors: TEST_DATA.product.colors,
      wholesaleData: {
        isWholesaler: true,
        packageType: 'simple'
      }
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    expect(createdProduct).toBeDefined();
    expect(createdProduct.wholesaleData?.isWholesaler).toBe(true);
    expect(createdProduct.wholesaleData?.packageType).toBe('simple');
    expect(createdProduct.prices.wholesale?.half_dozen).toBe(200);
    expect(createdProduct.prices.wholesale?.dozen).toBe(200);
    expect(createdProduct.percentages.wholesale?.half_dozen).toBe(55);
    expect(createdProduct.percentages.wholesale?.dozen).toBe(20);
  });

  it('should create a wholesale product with complex package type', async () => {
    const costPrice = 15000;
    const halfDozenPercentage = 55;
    const dozenPercentage = 20;

    const productDto: CreateProductDto = {
      id: TEST_DATA.product._id.toString(),
      name: TEST_DATA.product.name,
      description: TEST_DATA.product.description,
      code: TEST_DATA.product.code,
      categories: TEST_DATA.product.categories,
      attributes: TEST_DATA.product.attributes,
      pictures: TEST_DATA.product.pictures,
      prices: {
        ...TEST_DATA.product.prices,
        cost: costPrice,
        wholesale: {
          half_dozen: 150,
          dozen: 120
        }
      },
      percentages: {
        ...TEST_DATA.product.percentages,
        wholesale: {
          half_dozen: halfDozenPercentage,
          dozen: dozenPercentage
        }
      },
      sizeType: TEST_DATA.product.size_type,
      sizes: TEST_DATA.product.sizes,
      colors: TEST_DATA.product.colors,
      wholesaleData: {
        isWholesaler: true,
        packageType: 'complex'
      }
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    expect(createdProduct).toBeDefined();
    expect(createdProduct.wholesaleData?.isWholesaler).toBe(true);
    expect(createdProduct.wholesaleData?.packageType).toBe('complex');
    expect(createdProduct.prices.wholesale?.half_dozen).toBe(roundUpTo100(costPrice + costPrice * (halfDozenPercentage / 100)));
    expect(createdProduct.prices.wholesale?.dozen).toBe(roundUpTo100(costPrice + costPrice * (dozenPercentage / 100)));
    expect(createdProduct.percentages.wholesale?.half_dozen).toBe(halfDozenPercentage);
    expect(createdProduct.percentages.wholesale?.dozen).toBe(dozenPercentage);
  });
}); 