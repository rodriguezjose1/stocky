import { MongoClient, ObjectId } from 'mongodb';

async function findProductsWithOrphanedCategories() {
  // Define MongoDB connection URL directly
  const uri = 'mongodb+srv://admin:admin@cluster0.pcumk.mongodb.net/stocky?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');

    // Get all categories
    const categories = await categoriesCollection.find({}).toArray();
    console.log(`Found ${categories.length} categories`);

    // Create a map of category IDs to their parent status
    const categoryParentMap = new Map();
    categories.forEach(category => {
      const categoryId = category._id.toString();
      const hasParent = category.parent !== null && category.parent !== undefined;
      categoryParentMap.set(categoryId, {
        name: category.name,
        hasParent,
        parentId: hasParent ? category.parent.toString() : null
      });
    });

    // Count categories without parents
    const orphanedCategories = Array.from(categoryParentMap.entries())
      .filter(([_, info]) => !info.hasParent);
    
    console.log(`Found ${orphanedCategories.length} categories without parents`);

    // Get all products
    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products`);

    // Find products with orphaned categories
    const productsWithOrphanedCategories = [];
    
    for (const product of products) {
      if (!product.categories || product.categories.length === 0) {
        continue; // Skip products without categories
      }

      const productCategories = product.categories.map(id => id.toString());
      const orphanedCategoryIds = productCategories.filter(categoryId => 
        categoryParentMap.has(categoryId) && !categoryParentMap.get(categoryId).hasParent
      );

      if (orphanedCategoryIds.length > 0) {
        productsWithOrphanedCategories.push({
          id: product._id.toString(),
          name: product.name,
          code: product.code,
          orphanedCategories: orphanedCategoryIds.map(categoryId => ({
            id: categoryId,
            name: categoryParentMap.get(categoryId).name
          }))
        });
      }
    }

    console.log(`Found ${productsWithOrphanedCategories.length} products with orphaned categories`);

    // Output the results
    console.log('\nProducts with orphaned categories:');
    console.log(JSON.stringify(productsWithOrphanedCategories, null, 2));

    // Output orphaned categories
    console.log('\nOrphaned categories:');
    orphanedCategories.forEach(([categoryId, info]) => {
      console.log(`- ${info.name} (${categoryId})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

findProductsWithOrphanedCategories().catch(console.error); 