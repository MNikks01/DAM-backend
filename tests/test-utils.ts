// test-utils.ts
import type { Request } from "express";
import { Types } from "mongoose";

export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: undefined,
    ...overrides
});

export const createMockResponse = (): any => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    return res;
};

export const mockNextFunction = jest.fn();

export const mockUser = {
    userId: new Types.ObjectId().toString(),
    team: "test-team",
    role: "user"
};