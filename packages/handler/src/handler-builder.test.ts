import { assert, isErr, isOk } from "trynot";
import { describe, expect, it, vi } from "vitest";
import { VaultError } from "./errors";
import { createVaultHandler, handleVaultRequest } from "./handler-builder";
import type { HandlerAdapter } from "./handler-types";
import type { IVault } from "./types";

const createMockVault = () => {
  const mockVault = {
    getWallet: vi.fn(),
    signData: vi.fn(),
    signTransaction: vi.fn(),
  } as unknown as IVault;

  return mockVault;
};

type MockContext = {
  path: string;
  method: string;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
};

const createMockAdapter = (
  overrides: Partial<HandlerAdapter<[string], MockContext, string>> = {},
) => {
  const defaultAdapter: HandlerAdapter<[string], MockContext, string> = {
    getContext: vi.fn().mockResolvedValue({
      path: "/users/test-user/wallet",
      method: "GET",
      body: {},
      query: {},
    }),
    getPath: vi.fn().mockImplementation((ctx) => ctx.path),
    getMethod: vi.fn().mockImplementation((ctx) => ctx.method),
    getBody: vi.fn().mockImplementation((ctx) => ctx.body),
    getQuery: vi.fn().mockImplementation((ctx) => ctx.query),
    sendResponse: vi.fn().mockResolvedValue("response sent"),
  };

  return { ...defaultAdapter, ...overrides };
};

describe("createVaultHandler", () => {
  it("should create a handler function", () => {
    const vault = createMockVault();
    const adapter = createMockAdapter();

    const handler = createVaultHandler({ vault, adapter });

    expect(typeof handler).toBe("function");
  });

  it("should process successful request", async () => {
    const vault = createMockVault();
    vi.mocked(vault.getWallet).mockResolvedValue({
      addresses: {
        base: { bech32: "addr_test1...", hex: "82d818..." },
        enterprise: { bech32: "addr_test1...", hex: "82d818..." },
        reward: { bech32: "addr_test1...", hex: "82d818..." },
      },
    });

    const adapter = createMockAdapter();
    const handler = createVaultHandler({ vault, adapter });

    const result = await handler("test-input");

    expect(adapter.getContext).toHaveBeenCalledWith("test-input");
    expect(adapter.sendResponse).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        response: expect.objectContaining({
          addresses: expect.any(Object),
        }),
      }),
    );
    expect(result).toBe("response sent");
  });

  it("should handle vault errors", async () => {
    const vault = createMockVault();
    vi.mocked(vault.getWallet).mockResolvedValue(
      new VaultError({ message: "Test error", statusCode: 500 }),
    );

    const adapter = createMockAdapter();
    const handler = createVaultHandler({ vault, adapter });

    await handler("test-input");

    expect(adapter.sendResponse).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        message: "Test error",
        statusCode: 500,
      }),
    );
  });
});

describe("handleVaultRequest", () => {
  describe("path validation", () => {
    it("should reject paths that don't start with /users", async () => {
      const vault = createMockVault();
      const context = {
        path: "/invalid/path",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe("Not found");
    });

    it("should reject paths with less than 3 parts", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe("Not found");
    });

    it("should reject paths with empty userId", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users//wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe("Not found");
    });

    it("should reject unknown operations", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users/test-user/unknown-operation",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe("Not found");
    });
  });

  describe("method validation", () => {
    it("should reject wrong method for wallet operation", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users/test-user/wallet",
        method: "POST", // Should be GET
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result.statusCode).toBe(405);
      expect(result.message).toBe("Method not allowed");
    });

    it("should reject wrong method for sign-data operation", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users/test-user/sign-data",
        method: "GET", // Should be POST
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result.statusCode).toBe(405);
      expect(result.message).toBe("Method not allowed");
    });

    it("should accept case insensitive methods", async () => {
      const vault = createMockVault();
      vi.mocked(vault.getWallet).mockResolvedValue({
        addresses: {
          base: { bech32: "addr_test1...", hex: "82d818..." },
          enterprise: { bech32: "addr_test1...", hex: "82d818..." },
          reward: { bech32: "addr_test1...", hex: "82d818..." },
        },
      });

      const context = {
        path: "/users/test-user/wallet",
        method: "get", // lowercase
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
    });
  });

  describe("input validation", () => {
    it("should validate required fields for sign-data", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users/test-user/sign-data",
        method: "POST",
        body: { userId: "test-user" }, // Missing payload
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return validation error");
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe("Bad request");
    });

    it("should validate required fields for sign-transaction", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users/test-user/sign-transaction",
        method: "POST",
        body: { userId: "test-user" }, // Missing transaction
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return validation error");
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe("Bad request");
    });

    it("should handle missing body gracefully", async () => {
      const vault = createMockVault();
      vi.mocked(vault.getWallet).mockResolvedValue({
        addresses: {
          base: { bech32: "addr_test1...", hex: "82d818..." },
          enterprise: { bech32: "addr_test1...", hex: "82d818..." },
          reward: { bech32: "addr_test1...", hex: "82d818..." },
        },
      });

      const context = {
        path: "/users/test-user/wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter({
        getBody: vi.fn().mockRejectedValue(new Error("No body")),
      });

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed despite body error");
    });
  });

  describe("wallet operations", () => {
    it("should handle GET /users/{userId}/wallet", async () => {
      const vault = createMockVault();
      const expectedResponse = {
        addresses: {
          base: { bech32: "addr_test1...", hex: "82d818..." },
          enterprise: { bech32: "addr_test1...", hex: "82d818..." },
          reward: { bech32: "addr_test1...", hex: "82d818..." },
        },
      };
      vi.mocked(vault.getWallet).mockResolvedValue(expectedResponse);

      const context = {
        path: "/users/test-user-123/wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
      expect(result.response).toEqual(expectedResponse);
      expect(vault.getWallet).toHaveBeenCalledWith({ userId: "test-user-123" });
    });

    it("should use query parameters for GET requests", async () => {
      const vault = createMockVault();
      vi.mocked(vault.getWallet).mockResolvedValue({
        addresses: {
          base: { bech32: "addr_test1...", hex: "82d818..." },
          enterprise: { bech32: "addr_test1...", hex: "82d818..." },
          reward: { bech32: "addr_test1...", hex: "82d818..." },
        },
      });

      const context = {
        path: "/users/test-user-123/wallet",
        method: "GET",
        body: {},
        query: { someParam: "value" },
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
      expect(adapter.getQuery).toHaveBeenCalledWith(context);
    });
  });

  describe("sign-data operations", () => {
    it("should handle POST /users/{userId}/sign-data", async () => {
      const vault = createMockVault();
      const expectedResponse = {
        signature: "signature-hex",
        key: "key-hex",
      };
      vi.mocked(vault.signData).mockResolvedValue(expectedResponse);

      const context = {
        path: "/users/test-user-123/sign-data",
        method: "POST",
        body: {
          userId: "test-user-123",
          payload: "hello world",
          externalAad: "additional-data",
        },
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
      expect(result.response).toEqual(expectedResponse);
      expect(vault.signData).toHaveBeenCalledWith({
        userId: "test-user-123",
        payload: "hello world",
        externalAad: "additional-data",
      });
    });

    it("should handle sign-data without externalAad", async () => {
      const vault = createMockVault();
      const expectedResponse = {
        signature: "signature-hex",
        key: "key-hex",
      };
      vi.mocked(vault.signData).mockResolvedValue(expectedResponse);

      const context = {
        path: "/users/test-user-123/sign-data",
        method: "POST",
        body: {
          userId: "test-user-123",
          payload: "hello world",
        },
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
      expect(vault.signData).toHaveBeenCalledWith({
        userId: "test-user-123",
        payload: "hello world",
        externalAad: undefined,
      });
    });
  });

  describe("sign-transaction operations", () => {
    it("should handle POST /users/{userId}/sign-transaction", async () => {
      const vault = createMockVault();
      const expectedResponse = {
        signedTransaction: "signed-tx-hex",
      };
      vi.mocked(vault.signTransaction).mockResolvedValue(expectedResponse);

      const context = {
        path: "/users/test-user-123/sign-transaction",
        method: "POST",
        body: {
          userId: "test-user-123",
          transaction: "tx-hex",
        },
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
      expect(result.response).toEqual(expectedResponse);
      expect(vault.signTransaction).toHaveBeenCalledWith({
        userId: "test-user-123",
        transaction: "tx-hex",
      });
    });
  });

  describe("error handling", () => {
    it("should handle vault errors from getWallet", async () => {
      const vault = createMockVault();
      const vaultError = new VaultError({
        message: "Wallet error",
        statusCode: 422,
      });
      vi.mocked(vault.getWallet).mockResolvedValue(vaultError);

      const context = {
        path: "/users/test-user/wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result).toBe(vaultError);
    });

    it("should handle generic errors from vault", async () => {
      const vault = createMockVault();
      const genericError = new VaultError({
        message: "Generic vault error",
        statusCode: 500,
      });
      vi.mocked(vault.getWallet).mockResolvedValue(genericError);

      const context = {
        path: "/users/test-user/wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result).toBe(genericError);
      expect(result.message).toBe("Generic vault error");
      expect(result.statusCode).toBe(500);
    });

    it("should handle adapter errors", async () => {
      const vault = createMockVault();
      const context = {
        path: "/users/test-user/wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter({
        getPath: vi.fn().mockRejectedValue(new Error("Adapter error")),
      });

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result).toBeInstanceOf(VaultError);
      expect(result.message).toBe("Internal server error");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unexpected errors during operation", async () => {
      const vault = createMockVault();
      vi.mocked(vault.getWallet).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const context = {
        path: "/users/test-user/wallet",
        method: "GET",
        body: {},
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isErr(result), "should return error");
      expect(result).toBeInstanceOf(VaultError);
      expect(result.message).toBe("Internal server error");
      expect(result.statusCode).toBe(500);
    });
  });

  describe("userId injection", () => {
    it("should inject userId from path into request data", async () => {
      const vault = createMockVault();
      vi.mocked(vault.signData).mockResolvedValue({
        signature: "sig",
        key: "key",
      });

      const context = {
        path: "/users/path-user-id/sign-data",
        method: "POST",
        body: {
          payload: "test",
          userId: "body-user-id", // This should be overridden
        },
        query: {},
      };
      const adapter = createMockAdapter();

      const result = await handleVaultRequest(context, vault, adapter);

      assert(isOk(result), "should succeed");
      expect(vault.signData).toHaveBeenCalledWith({
        userId: "path-user-id", // Should use path userId, not body userId
        payload: "test",
        externalAad: undefined,
      });
    });
  });
});
