import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet: MongoMemoryReplSet;

export const startInMemoryMongoReplicaSet = async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 }, // número de réplicas (1 basta para habilitar transacciones)
  });

  const uri = replSet.getUri();
  
  // Habilitar el debug de Mongoose con una función personalizada que evita la serialización de la sesión
  // mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any) => {
  //   // Evitar serializar la sesión
  //   const safeQuery = query && typeof query === 'object' ? { ...query } : query;
  //   if (safeQuery && safeQuery.session) {
  //     delete safeQuery.session;
  //   }
    
  //   const safeDoc = doc && typeof doc === 'object' ? { ...doc } : doc;
  //   if (safeDoc && safeDoc.session) {
  //     delete safeDoc.session;
  //   }
    
  //   console.log(`Mongoose: ${collectionName}.${method}`, {
  //     query: JSON.stringify(safeQuery),
  //     doc: JSON.stringify(safeDoc)
  //   });
  // });

  await mongoose.connect(uri, {
    useUnifiedTopology: true,
    // Evitar la serialización de la sesión
    autoCreate: false,
    autoIndex: false,
  } as any);

  return uri;
};

export const stopInMemoryMongoReplicaSet = async () => {
  await mongoose.disconnect();
  await replSet.stop();
}; 