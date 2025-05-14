import { Connection } from 'mongoose';
import * as mongoose from 'mongoose';

export const MASTER_DATA = {
  category: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Category',
    slug: 'test-category',
    parent: null,
    ancestors: [],
    children: [],
    size_types: [
      new mongoose.Types.ObjectId('507f1f77bcf86cd799439012')
    ],
  },
  sizeType: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    type: 'size',
    label_type: 'Test Size Type',
    value: 'test-size-type',
  },
  categoryLevel1: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439016'),
    name: 'Category Level 1',
    slug: 'category-level-1',
    parent: '507f1f77bcf86cd799439011',
    ancestors: [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Category',
        slug: 'test-category'
      }
    ],
    children: [],
    size_types: [
      new mongoose.Types.ObjectId('507f1f77bcf86cd799439012')
    ],
  },
};

export async function seedMasterData(connection: Connection) {
  // Insertar datos maestros solo si no existen
  const sizeTypeExists = await connection.db.collection('productattributesubtypes').findOne({ _id: MASTER_DATA.sizeType._id });
  const categoryExists = await connection.db.collection('categories').findOne({ _id: MASTER_DATA.category._id });
  const categoryLevel1Exists = await connection.db.collection('categories').findOne({ _id: MASTER_DATA.categoryLevel1._id });

  if (!sizeTypeExists) {
    await connection.db.collection('productattributesubtypes').insertOne(MASTER_DATA.sizeType);
  }
  if (!categoryExists) {
    await connection.db.collection('categories').insertOne(MASTER_DATA.category);
  }
  if (!categoryLevel1Exists) {
    await connection.db.collection('categories').insertOne(MASTER_DATA.categoryLevel1);
  }
} 