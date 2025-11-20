import { VaultError } from "@anvil-vault/utils";
import type { Context } from "hono";

import { describe, expect, it, vi } from "vitest";
import { honoAdapter } from "./hono-adapter";

const createMockRequest = (overrides?: Partial<Context["req"]>) =>
  ({
    method: "GET",
    path: "/users/test-user/wallet",
    json: vi.fn().mockReturnValue({}),
    query: vi.fn().mockReturnValue({}),
    ...overrides,
  }) as Context["req"];
const createMockResponse = (value = {}) => vi.fn().mockReturnValue(value);

const createMockHono = (ctx?: Partial<Context>): Context =>
  ({ req: createMockRequest(), json: createMockResponse(), ...ctx }) as Context;

describe("honoAdapter", () => {
  describe("getContext", () => {
    it("should return context with req and res", async () => {
      const c = createMockHono();

      const context = await honoAdapter.getContext(c);

      expect(context).toEqual(c);
    });
  });

  describe("getBody", () => {
    it("should return request body", async () => {
      const body = { userId: "test", payload: "data" };
      const req = createMockRequest({ json: vi.fn().mockReturnValue(body) });
      const c = createMockHono({ req });

      const result = await honoAdapter.getBody(c);

      expect(result).toEqual(body);
    });

    it("should return empty object when body is undefined", async () => {
      const req = createMockRequest({ json: vi.fn().mockReturnValue(undefined) });
      const context = createMockHono({ req });

      const result = await honoAdapter.getBody(context);

      expect(result).toEqual({});
    });
  });

  describe("getMethod", () => {
    it("should return request method", async () => {
      const req = createMockRequest({ method: "POST" });
      const context = createMockHono({ req });

      const result = await honoAdapter.getMethod(context);

      expect(result).toBe("POST");
    });
  });

  describe("getPath", () => {
    it("should return request path", async () => {
      const req = createMockRequest({ path: "/users/123/sign-data" });
      const context = createMockHono({ req });

      const result = await honoAdapter.getPath(context);

      expect(result).toBe("/users/123/sign-data");
    });
  });

  describe("getQuery", () => {
    it("should return request query parameters", async () => {
      const query = { param1: "value1", param2: "value2" };
      const req = createMockRequest({ query: vi.fn().mockReturnValue(query) });
      const context = createMockHono({ req });

      const result = await honoAdapter.getQuery(context);

      expect(result).toEqual(query);
    });

    it("should handle empty query", async () => {
      const context = createMockHono();

      const result = await honoAdapter.getQuery(context);

      expect(result).toEqual({});
    });
  });

  describe("sendResponse", () => {
    it("should send successful response", async () => {
      const context = createMockHono();

      const successResult = {
        response: {
          addresses: {
            base: { bech32: "addr_test1...", hex: "82d818..." },
          },
        },
      };

      await honoAdapter.sendResponse(context, successResult);

      expect(context.json).toHaveBeenCalledWith(successResult.response, 200);
    });

    it("should send error response with VaultError", async () => {
      const context = createMockHono();

      const vaultError = new VaultError({
        message: "Test error",
        statusCode: 422,
        cause: new Error("Root cause"),
      });

      await honoAdapter.sendResponse(context, vaultError);

      const res = {
        error: "Test error: Root cause",
        statusCode: 422,
      };
      expect(context.json).toHaveBeenCalledWith(res, res.statusCode);
    });

    it("should send error response with nested causes keeping only the first cause", async () => {
      const context = createMockHono();

      const rootCause = new Error("Root cause");
      const middleCause = new Error("Middle cause");
      middleCause.cause = rootCause;

      const vaultError = new VaultError({
        message: "Main error",
        statusCode: 500,
        cause: middleCause,
      });

      await honoAdapter.sendResponse(context, vaultError);
      const res = { error: "Main error: Middle cause", statusCode: 500 };
      expect(context.json).toHaveBeenCalledWith(res, res.statusCode);
    });

    it("should handle error without cause", async () => {
      const context = createMockHono();

      const vaultError = new VaultError({
        message: "Simple error",
        statusCode: 400,
      });

      await honoAdapter.sendResponse(context, vaultError);

      const res = { error: "Simple error", statusCode: 400 };
      expect(context.json).toHaveBeenCalledWith(res, res.statusCode);
    });
  });

  describe("errorToJson function", () => {
    it("should convert Error to JSON", () => {
      const context = createMockHono();

      const error = new Error("Test error");
      const vaultError = new VaultError({
        message: "Wrapper error",
        statusCode: 500,
        cause: error,
      });

      honoAdapter.sendResponse(context, vaultError);

      const res = { error: "Wrapper error: Test error", statusCode: 500 };
      expect(context.json).toHaveBeenCalledWith(res, res.statusCode);
    });

    it("should handle non-Error objects as cause", () => {
      const context = createMockHono();

      const vaultError = new VaultError({
        message: "Main error",
        statusCode: 500,
        cause: "string cause",
      });

      honoAdapter.sendResponse(context, vaultError);

      const res = { error: "Main error: string cause", statusCode: 500 };
      expect(context.json).toHaveBeenCalledWith(res, 500);
    });

    it("should handle null/undefined causes", () => {
      const context = createMockHono();

      const vaultError = new VaultError({
        message: "Main error",
        statusCode: 500,
        cause: null,
      });

      honoAdapter.sendResponse(context, vaultError);

      const res = {
        error: "Main error",
        statusCode: 500,
      };
      expect(context.json).toHaveBeenCalledWith(res, res.statusCode);
    });
  });

  describe("integration", () => {
    it("should work with all adapter functions in sequence", async () => {
      const body = { payload: "test data" };
      const query = { debug: "true" };
      const req = createMockRequest({
        method: "POST",
        path: "/users/test-user/sign-data",
        json: vi.fn().mockReturnValue(body),
        query: vi.fn().mockReturnValue(query),
      });
      const c = createMockHono({ req });
      const context = await honoAdapter.getContext(c);
      expect(context).toEqual(c);

      const method = await honoAdapter.getMethod(context);
      expect(method).toBe("POST");

      const path = await honoAdapter.getPath(context);
      expect(path).toBe("/users/test-user/sign-data");

      const requestBody = await honoAdapter.getBody(context);
      expect(requestBody).toEqual(body);

      const requestQuery = await honoAdapter.getQuery(context);
      expect(requestQuery).toEqual(query);

      const successResponse = {
        response: { signature: "test-sig", key: "test-key" },
      };
      await honoAdapter.sendResponse(context, successResponse);

      expect(context.json).toHaveBeenCalledWith(successResponse.response, 200);
    });

    it("should handle mixed data types in request", async () => {
      const req = createMockRequest({
        method: "GET",
        path: "/users/test-user/wallet",
        json: vi.fn().mockReturnValue(null),
        query: vi.fn().mockReturnValue({
          include: ["addresses", "metadata"],
          format: "json",
          verbose: "true",
        }),
      });
      const context = createMockHono({ req });

      const body = await honoAdapter.getBody(context);
      expect(body).toEqual({});

      const query = await honoAdapter.getQuery(context);
      expect(query).toEqual({
        include: ["addresses", "metadata"],
        format: "json",
        verbose: "true",
      });
    });
  });

  describe("type safety", () => {
    it("should work with properly typed Request and Response", async () => {
      const c = createMockHono();

      const context = await honoAdapter.getContext(c);
      const method = await honoAdapter.getMethod(context);
      const path = await honoAdapter.getPath(context);

      expect(typeof method).toBe("string");
      expect(typeof path).toBe("string");
    });
  });
});
