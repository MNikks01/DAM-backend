// tests/mocks/mongoose.mock.ts
import mongoose from 'mongoose';

// Mock mongoose connection
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');

    return {
        ...actualMongoose,
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        connection: {
            readyState: 1,
            db: {
                databaseName: 'test',
                collection: jest.fn().mockReturnValue({
                    deleteMany: jest.fn().mockResolvedValue({}),
                    find: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue([]),
                    }),
                    findOne: jest.fn().mockResolvedValue(null),
                    insertOne: jest.fn().mockResolvedValue({}),
                }),
            },
            collections: {},
        },
    };
});

export default mongoose;