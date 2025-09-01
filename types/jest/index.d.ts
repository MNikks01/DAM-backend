// types/jest/index.d.ts
import 'jest';

declare global {
    namespace jest {
        interface Mock<T = any, Y extends any[] = any[]> {
            mockResolvedValue(value: any): this;
            mockReturnValue(value: any): this;
            mockImplementation(fn: (...args: Y) => T): this;
            mockResolvedValueOnce(value: any): this;
            mockReturnValueOnce(value: any): this;
            mockImplementationOnce(fn: (...args: Y) => T): this;
        }

        interface Mocked<T> {
            new(...args: any[]): T;
            prototype: T;
        }

        interface MockInstance<T, Y extends any[]> {
            mockResolvedValue(value: any): this;
            mockReturnValue(value: any): this;
            mockImplementation(fn: (...args: Y) => T): this;
        }
    }
}

// Extend Jest's expect to handle custom matchers
export { };