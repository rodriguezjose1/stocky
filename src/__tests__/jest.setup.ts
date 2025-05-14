import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'jest',
      args: ['--replSet', 'rs0'],
    },
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
}, 30000);

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
  // Clear environment variables
  delete process.env.MONGODB_URI;
}, 30000); 