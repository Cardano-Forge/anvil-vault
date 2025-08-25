import { VaultError } from "@anvil-vault/handler";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { expressAdapter } from "./express-adapter";

const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    method: "GET",
    path: "/users/test-user/wallet",
    body: {},
    query: {},
    ...overrides,
  }) as Request;

const createMockResponse = (): Response => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe("expressAdapter", () => {
  describe("getContext", () => {
    it("should return context with req and res", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const context = await expressAdapter.getContext(req, res);

      expect(context).toEqual({ req, res });
    });
  });

  describe("getBody", () => {
    it("should return request body", async () => {
      const body = { userId: "test", payload: "data" };
      const req = createMockRequest({ body });
      const res = createMockResponse();
      const context = { req, res };

      const result = await expressAdapter.getBody(context);

      expect(result).toEqual(body);
    });

    it("should return empty object when body is undefined", async () => {
      const req = createMockRequest({ body: undefined });
      const res = createMockResponse();
      const context = { req, res };

      const result = await expressAdapter.getBody(context);

      expect(result).toEqual({});
    });
  });

  describe("getMethod", () => {
    it("should return request method", async () => {
      const req = createMockRequest({ method: "POST" });
      const res = createMockResponse();
      const context = { req, res };

      const result = await expressAdapter.getMethod(context);

      expect(result).toBe("POST");
    });
  });

  describe("getPath", () => {
    it("should return request path", async () => {
      const req = createMockRequest({ path: "/users/123/sign-data" });
      const res = createMockResponse();
      const context = { req, res };

      const result = await expressAdapter.getPath(context);

      expect(result).toBe("/users/123/sign-data");
    });
  });

  describe("getQuery", () => {
    it("should return request query parameters", async () => {
      const query = { param1: "value1", param2: "value2" };
      const req = createMockRequest({ query });
      const res = createMockResponse();
      const context = { req, res };

      const result = await expressAdapter.getQuery(context);

      expect(result).toEqual(query);
    });

    it("should handle empty query", async () => {
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const context = { req, res };

      const result = await expressAdapter.getQuery(context);

      expect(result).toEqual({});
    });
  });

  describe("sendResponse", () => {
    it("should send successful response", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const successResult = {
        response: {
          addresses: {
            base: { bech32: "addr_test1...", hex: "82d818..." },
          },
        },
      };

      await expressAdapter.sendResponse(context, successResult);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(successResult.response);
    });

    it("should send error response with VaultError", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const vaultError = new VaultError({
        message: "Test error",
        statusCode: 422,
        cause: new Error("Root cause"),
      });

      await expressAdapter.sendResponse(context, vaultError);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        message: "Test error",
        cause: {
          message: "Root cause",
        },
      });
    });

    it("should send error response with nested causes", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const rootCause = new Error("Root cause");
      const middleCause = new Error("Middle cause");
      middleCause.cause = rootCause;

      const vaultError = new VaultError({
        message: "Main error",
        statusCode: 500,
        cause: middleCause,
      });

      await expressAdapter.sendResponse(context, vaultError);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Main error",
        cause: {
          message: "Middle cause",
          cause: {
            message: "Root cause",
          },
        },
      });
    });

    it("should handle error without cause", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const vaultError = new VaultError({
        message: "Simple error",
        statusCode: 400,
      });

      await expressAdapter.sendResponse(context, vaultError);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Simple error",
      });
    });
  });

  describe("errorToJson function", () => {
    it("should convert Error to JSON", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const error = new Error("Test error");
      const vaultError = new VaultError({
        message: "Wrapper error",
        statusCode: 500,
        cause: error,
      });

      expressAdapter.sendResponse(context, vaultError);

      expect(res.json).toHaveBeenCalledWith({
        message: "Wrapper error",
        cause: {
          message: "Test error",
        },
      });
    });

    it("should handle non-Error objects as cause", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const vaultError = new VaultError({
        message: "Main error",
        statusCode: 500,
        cause: "string cause",
      });

      expressAdapter.sendResponse(context, vaultError);

      expect(res.json).toHaveBeenCalledWith({
        message: "Main error",
      });
    });

    it("should handle null/undefined causes", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const context = { req, res };

      const vaultError = new VaultError({
        message: "Main error",
        statusCode: 500,
        cause: null,
      });

      expressAdapter.sendResponse(context, vaultError);

      expect(res.json).toHaveBeenCalledWith({
        message: "Main error",
      });
    });
  });

  describe("integration", () => {
    it("should work with all adapter methods in sequence", async () => {
      const body = { payload: "test data" };
      const query = { debug: "true" };
      const req = createMockRequest({
        method: "POST",
        path: "/users/test-user/sign-data",
        body,
        query,
      });
      const res = createMockResponse();

      const context = await expressAdapter.getContext(req, res);
      expect(context).toEqual({ req, res });

      const method = await expressAdapter.getMethod(context);
      expect(method).toBe("POST");

      const path = await expressAdapter.getPath(context);
      expect(path).toBe("/users/test-user/sign-data");

      const requestBody = await expressAdapter.getBody(context);
      expect(requestBody).toEqual(body);

      const requestQuery = await expressAdapter.getQuery(context);
      expect(requestQuery).toEqual(query);

      const successResponse = {
        response: { signature: "test-sig", key: "test-key" },
      };
      await expressAdapter.sendResponse(context, successResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(successResponse.response);
    });

    it("should handle mixed data types in request", async () => {
      const req = createMockRequest({
        method: "GET",
        path: "/users/test-user/wallet",
        body: null,
        query: {
          include: ["addresses", "metadata"],
          format: "json",
          verbose: "true",
        },
      });
      const res = createMockResponse();
      const context = { req, res };

      const body = await expressAdapter.getBody(context);
      expect(body).toEqual({});

      const query = await expressAdapter.getQuery(context);
      expect(query).toEqual({
        include: ["addresses", "metadata"],
        format: "json",
        verbose: "true",
      });
    });
  });

  describe("type safety", () => {
    it("should work with properly typed Request and Response", async () => {
      const req: Request = createMockRequest();
      const res: Response = createMockResponse();

      const context = await expressAdapter.getContext(req, res);
      const method = await expressAdapter.getMethod(context);
      const path = await expressAdapter.getPath(context);

      expect(typeof method).toBe("string");
      expect(typeof path).toBe("string");
    });
  });
});
