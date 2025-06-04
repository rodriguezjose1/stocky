import { MongoClient, ObjectId } from 'mongodb';

// Map of product name translations
const productNameTranslations: { [key: string]: string } = {
  'slip': 'boxer'
};

// Function to translate size values
function translateSize(size: string): string {
  const sizeLower = size.toLowerCase();
  
  // Translate specific size values
  if (sizeLower === 'talle único') {
    return 'talle-unico';
  } else if (sizeLower === 'talle max (especial)') {
    return 'talle-max';
  } else if (sizeLower === 'tiro corto') {
    return 'tiro-corto';
  } else if (sizeLower === 'tiro medio') {
    return 'tiro-medio';
  } else if (sizeLower === 'tiro universal') {
    return 'tiro-universal';
  } else if (sizeLower === 'tiro especial') {
    return 'tiro-especial';
  }
  return sizeLower;
}

async function findAndFixInvalidSizeTypes() {
  // Define MongoDB connection URL directly
  const uri = 'mongodb+srv://admin:admin@cluster0.pcumk.mongodb.net/stocky?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');
    const subtypesCollection = db.collection('productattributesubtypes');
    const attributesCollection = db.collection('productattributes');
    const categoriesCollection = db.collection('categories');

    // Get all product attribute subtypes for sizes
    const sizeSubtypes = await subtypesCollection.find({ type: 'size' }).toArray();
    console.log(`Found ${sizeSubtypes.length} size subtypes`);

    // Get all product attributes for sizes
    const sizeAttributes = await attributesCollection.find({ type: 'size' }).toArray();
    console.log(`Found ${sizeAttributes.length} size attributes`);

    // Create a map of subtype IDs to their attributes
    const subtypeAttributesMap = new Map();
    sizeAttributes.forEach(attr => {
      if (attr.subtype) {
        const subtypeId = attr.subtype.toString();
        if (!subtypeAttributesMap.has(subtypeId)) {
          subtypeAttributesMap.set(subtypeId, []);
        }
        subtypeAttributesMap.get(subtypeId).push(attr);
      }
    });

    // Find products with invalid size_type
    const products = await productsCollection.find({}).toArray();
    const invalidProducts = products.filter(product => {
      const sizeTypeId = product.size_type?.toString();
      return sizeTypeId && !sizeSubtypes.some(st => st._id.toString() === sizeTypeId);
    });

    console.log(`Found ${invalidProducts.length} products with invalid size_type references`);

    // Array to collect products without exact matches
    const productsWithoutExactMatch = [];

    // Fix each invalid product
    for (const product of invalidProducts) {
      console.log(`\nProcessing product: ${product.name} (${product.code})`);
      console.log(`Current size_type: ${product.size_type}`);
      
      // Remove duplicates from product sizes and translate them
      const uniqueProductSizes = [...new Set(product.sizes.map(size => translateSize(size)))];
      console.log(`Original sizes: ${product.sizes.join(', ')}`);
      console.log(`Unique translated sizes: ${uniqueProductSizes.join(', ')}`);
      
      console.log(`Categories: ${product.categories.join(', ')}`);

      // Try to find the correct size_type based on the product's categories and sizes
      let newSizeTypeId = null;
      let categoryMatchingSubtypes = [];
      
      // First try: get size_types from the product's categories
      if (product.categories && product.categories.length > 0) {
        // Get all categories for this product
        const productCategories = await categoriesCollection.find({
          _id: { $in: product.categories.map(id => new ObjectId(id)) }
        }).toArray();
        
        console.log(`Found ${productCategories.length} categories for this product`);
        
        // Extract all size_types from these categories
        const categorySizeTypeIds = new Set();
        productCategories.forEach(category => {
          if (category.size_types && category.size_types.length > 0) {
            category.size_types.forEach(sizeTypeId => {
              categorySizeTypeIds.add(sizeTypeId.toString());
            });
          }
        });
        
        console.log(`Found ${categorySizeTypeIds.size} size_types from categories`);
        
        // Filter size subtypes to only include those from the product's categories
        categoryMatchingSubtypes = sizeSubtypes.filter(st => 
          categorySizeTypeIds.has(st._id.toString())
        );
        
        console.log(`Found ${categoryMatchingSubtypes.length} matching subtypes from categories`);
      }

      // If we found matching subtypes from categories, find the best match based on size overlap
      if (categoryMatchingSubtypes.length > 0) {
        console.log(`Evaluating ${categoryMatchingSubtypes.length} subtypes from categories`);
        
        // Check each subtype for an exact match
        let exactMatchFound = false;
        
        for (const subtype of categoryMatchingSubtypes) {
          const subtypeId = subtype._id.toString();
          const subtypeValue = subtype.value;
          
          // Find attributes that match this subtype's value
          const matchingAttributes = sizeAttributes.filter(attr => 
            attr.subtype === subtypeValue
          );
          
          // Remove duplicates from attribute sizes and translate them
          const subtypeSizeValues = [...new Set(matchingAttributes.map(attr => translateSize(attr.value)))];
          console.log(`Subtype ${subtypeValue} (${subtypeId}) has ${subtypeSizeValues.length} unique translated sizes: ${subtypeSizeValues.join(', ')}`);
          
          // Count how many product sizes match with this subtype's sizes
          const matchingSizes = uniqueProductSizes.filter(size => 
            subtypeSizeValues.includes(size.toString())
          );
          
          const score = matchingSizes.length;
          const isExactMatch = score === uniqueProductSizes.length && score === subtypeSizeValues.length;
          console.log(`Subtype ${subtypeValue} (${subtypeId}) has ${score} matching sizes: ${matchingSizes.join(', ')}`);
          console.log(`Is exact match: ${isExactMatch}`);
          
          // If we found an exact match, use it immediately and stop checking
          if (isExactMatch) {
            newSizeTypeId = subtypeId;
            console.log(`Found exact match! Using size_type: ${newSizeTypeId} (${subtypeValue})`);
            exactMatchFound = true;
            break;
          }
        }
        
        // If no exact match was found, add to the list of products without exact match
        if (!exactMatchFound) {
          console.log(`No exact match found for this product`);
          productsWithoutExactMatch.push({
            id: product._id.toString(),
            name: product.name,
            code: product.code,
            sizes: uniqueProductSizes,
            categories: product.categories
          });
        }
      } else {
        // If no matching subtypes from categories, try to match based on sizes
        let sizeMatchingSubtypes = [];
        if (uniqueProductSizes.length > 0) {
          // Find all subtypes that have at least one matching size
          const matchingSubtypeIds = new Set();
          
          // For each product size, find all subtypes that have an attribute with that exact value
          for (const size of uniqueProductSizes) {
            // Find all attributes with this exact value
            const matchingAttributes = sizeAttributes.filter(attr => 
              translateSize(attr.value) === size
            );
            
            // Add the subtype IDs of these attributes to the set
            matchingAttributes.forEach(attr => {
              if (attr.subtype) {
                matchingSubtypeIds.add(attr.subtype.toString());
              }
            });
          }

          sizeMatchingSubtypes = sizeSubtypes.filter(st => matchingSubtypeIds.has(st._id.toString()));
          console.log(`Found ${sizeMatchingSubtypes.length} subtypes matching by size`);
          
          // If we found matching subtypes by size, find the best match
          if (sizeMatchingSubtypes.length > 0) {
            // Check each subtype for an exact match
            let exactMatchFound = false;
            
            for (const subtype of sizeMatchingSubtypes) {
              const subtypeId = subtype._id.toString();
              const subtypeValue = subtype.value;
              
              // Find attributes that match this subtype's value
              const matchingAttributes = sizeAttributes.filter(attr => 
                attr.subtype && attr.subtype.toString() === subtypeId
              );
              
              // Remove duplicates from attribute sizes and translate them
              const subtypeSizeValues = [...new Set(matchingAttributes.map(attr => translateSize(attr.value)))];
              
              // Count how many product sizes match with this subtype's sizes
              const matchingSizes = uniqueProductSizes.filter(size => 
                subtypeSizeValues.includes(size.toString())
              );
              
              const score = matchingSizes.length;
              const isExactMatch = score === uniqueProductSizes.length && score === subtypeSizeValues.length;
              console.log(`Subtype ${subtypeValue} (${subtypeId}) has ${score} matching sizes: ${matchingSizes.join(', ')}`);
              console.log(`Is exact match: ${isExactMatch}`);
              
              // If we found an exact match, use it immediately and stop checking
              if (isExactMatch) {
                newSizeTypeId = subtypeId;
                console.log(`Found exact match! Using size_type: ${newSizeTypeId} (${subtypeValue})`);
                exactMatchFound = true;
                break;
              }
            }
            
            // If no exact match was found, add to the list of products without exact match
            if (!exactMatchFound) {
              console.log(`No exact match found for this product`);
              productsWithoutExactMatch.push({
                id: product._id.toString(),
                name: product.name,
                code: product.code,
                sizes: uniqueProductSizes,
                categories: product.categories
              });
            }
          } else {
            // If no matching subtypes by size, add to the list of products without exact match
            console.log(`No matching subtypes by size found for this product`);
            productsWithoutExactMatch.push({
              id: product._id.toString(),
              name: product.name,
              code: product.code,
              sizes: uniqueProductSizes,
              categories: product.categories
            });
          }
        } else {
          // If product has no sizes, add to the list of products without exact match
          console.log(`Product has no sizes`);
          productsWithoutExactMatch.push({
            id: product._id.toString(),
            name: product.name,
            code: product.code,
            sizes: uniqueProductSizes,
            categories: product.categories
          });
        }
      }

      // Update the product if we found a valid size_type with exact match
      if (newSizeTypeId) {
        try {
          await productsCollection.updateOne(
            { _id: product._id },
            { $set: { size_type: new ObjectId(newSizeTypeId) } }
          );
          console.log(`Updated product with new size_type: ${newSizeTypeId}`);
        } catch (error) {
          console.error(`Error updating product: ${error.message}`);
        }
      } else {
        console.log('Could not find a valid size_type with exact match for this product');
      }
    }

    console.log('\nFinished processing all products');
    console.log(`\nProducts without exact match (${productsWithoutExactMatch.length}):`);
    console.log(JSON.stringify(productsWithoutExactMatch, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

findAndFixInvalidSizeTypes().catch(console.error); 