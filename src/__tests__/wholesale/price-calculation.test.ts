import { roundUpTo100 } from '../../common/utils/math.utils';
import { TEST_DATA, TestContext, setupTestModule, cleanupTestModule, setupBeforeEach, logAfterEach } from './test-setup';

describe('Wholesale Price Calculations', () => {
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

  it('should calculate wholesale prices correctly for half dozen', async () => {
    const costPrice = 100;
    const halfDozenPercentage = 20;
    const expectedPrice = roundUpTo100(costPrice * (1 + halfDozenPercentage / 100));

    const productDto = {
      id: TEST_DATA.product._id.toString(),
      name: TEST_DATA.product.name,
      description: TEST_DATA.product.description,
      code: TEST_DATA.product.code,
      categories: TEST_DATA.product.categories,
      attributes: TEST_DATA.product.attributes,
      pictures: TEST_DATA.product.pictures,
      prices: {
        cost: costPrice,
        retail: 0,
        reseller: 0,
        wholesale: {
          half_dozen: 0,
          dozen: 0
        }
      },
      percentages: {
        reseller: 30,
        retail: 50,
        wholesale: {
          half_dozen: halfDozenPercentage,
          dozen: 30
        }
      },
      sizeType: TEST_DATA.product.size_type,
      sizes: TEST_DATA.product.sizes,
      colors: TEST_DATA.product.colors,
      wholesaleData: {
        isWholesaler: true,
        packageType: "simple" as const
      }
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    expect(createdProduct.prices.wholesale?.half_dozen).toBe(expectedPrice);
  });

  it('should calculate wholesale prices correctly for dozen', async () => {
    const costPrice = 100;
    const dozenPercentage = 30;
    const expectedPrice = roundUpTo100(costPrice * (1 + dozenPercentage / 100));

    const productDto = {
      id: TEST_DATA.product._id.toString(),
      name: TEST_DATA.product.name,
      description: TEST_DATA.product.description,
      code: TEST_DATA.product.code,
      categories: TEST_DATA.product.categories,
      attributes: TEST_DATA.product.attributes,
      pictures: TEST_DATA.product.pictures,
      prices: {
        cost: costPrice,
        retail: 0,
        reseller: 0,
        wholesale: {
          half_dozen: 0,
          dozen: 0
        }
      },
      percentages: {
        reseller: 30,
        retail: 50,
        wholesale: {
          half_dozen: 20,
          dozen: dozenPercentage
        }
      },
      sizeType: TEST_DATA.product.size_type,
      sizes: TEST_DATA.product.sizes,
      colors: TEST_DATA.product.colors,
      wholesaleData: {
        isWholesaler: true,
        packageType: "simple" as const
      }
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    expect(createdProduct.prices.wholesale?.dozen).toBe(expectedPrice);
  });

  it('should calculate both wholesale prices correctly', async () => {
    const costPrice = 100;
    const halfDozenPercentage = 20;
    const dozenPercentage = 30;
    const expectedHalfDozenPrice = roundUpTo100(costPrice * (1 + halfDozenPercentage / 100));
    const expectedDozenPrice = roundUpTo100(costPrice * (1 + dozenPercentage / 100));

    const productDto = {
      id: TEST_DATA.product._id.toString(),
      name: TEST_DATA.product.name,
      description: TEST_DATA.product.description,
      code: TEST_DATA.product.code,
      categories: TEST_DATA.product.categories,
      attributes: TEST_DATA.product.attributes,
      pictures: TEST_DATA.product.pictures,
      prices: {
        cost: costPrice,
        retail: 0,
        reseller: 0,
        wholesale: {
          half_dozen: 0,
          dozen: 0
        }
      },
      percentages: {
        reseller: 30,
        retail: 50,
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
        packageType: "simple" as const
      }
    };

    const createdProduct = await context.productUseCases.createProduct(productDto);
    expect(createdProduct.prices.wholesale?.half_dozen).toBe(expectedHalfDozenPrice);
    expect(createdProduct.prices.wholesale?.dozen).toBe(expectedDozenPrice);
  });
}); 