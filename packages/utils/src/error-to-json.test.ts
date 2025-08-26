import { describe, expect, it } from "vitest";
import { type ErrorToJsonOpts, type ErrorToJsonOutput, errorToJson } from "./error-to-json";
import { VaultError } from "./vault-error";

describe("errorToJson", () => {
  describe("with VaultError", () => {
    it("should return statusCode from VaultError instance", () => {
      const vaultError = new VaultError({
        message: "Authentication failed",
        statusCode: 401,
      });

      const result = errorToJson(vaultError);

      expect(result).toEqual({
        statusCode: 401,
        error: "Authentication failed",
      });
    });

    it("should use VaultError statusCode even when defaultStatusCode is provided", () => {
      const vaultError = new VaultError({
        message: "Forbidden",
        statusCode: 403,
      });

      const result = errorToJson(vaultError, { defaultStatusCode: 500 });

      expect(result).toEqual({
        statusCode: 403,
        error: "Forbidden",
      });
    });

    it("should handle VaultError with cause", () => {
      const originalError = new Error("Database connection failed");
      const vaultError = new VaultError({
        message: "User lookup failed",
        statusCode: 500,
        cause: originalError,
      });

      const result = errorToJson(vaultError);

      expect(result).toEqual({
        statusCode: 500,
        error: "User lookup failed: Database connection failed",
      });
    });
  });

  describe("with standard Error", () => {
    it("should use defaultStatusCode for standard Error", () => {
      const error = new Error("Something went wrong");

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Something went wrong",
      });
    });

    it("should use custom defaultStatusCode for standard Error", () => {
      const error = new Error("Bad request");

      const result = errorToJson(error, { defaultStatusCode: 400 });

      expect(result).toEqual({
        statusCode: 400,
        error: "Bad request",
      });
    });

    it("should handle Error with cause", () => {
      const cause = new Error("Root cause");
      const error = new Error("Main error", { cause });

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Main error: Root cause",
      });
    });
  });

  describe("with string errors", () => {
    it("should handle string error", () => {
      const error = "Network timeout";

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Network timeout",
      });
    });

    it("should use custom defaultStatusCode with string error", () => {
      const error = "Validation failed";

      const result = errorToJson(error, { defaultStatusCode: 422 });

      expect(result).toEqual({
        statusCode: 422,
        error: "Validation failed",
      });
    });
  });

  describe("with null/undefined errors", () => {
    it("should handle null error", () => {
      const result = errorToJson(null);

      expect(result).toEqual({
        statusCode: 500,
        error: "Internal server error",
      });
    });

    it("should handle undefined error", () => {
      const result = errorToJson(undefined);

      expect(result).toEqual({
        statusCode: 500,
        error: "Internal server error",
      });
    });

    it("should use custom defaultError with null", () => {
      const result = errorToJson(null, { defaultError: "Custom error message" });

      expect(result).toEqual({
        statusCode: 500,
        error: "Custom error message",
      });
    });
  });

  describe("with object errors", () => {
    it("should handle plain object error", () => {
      const error = { message: "Object error", code: "ERR001" };

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Object error",
      });
    });

    it("should handle empty object", () => {
      const error = {};

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Internal server error",
      });
    });
  });

  describe("with number errors", () => {
    it("should handle number error", () => {
      const error = 404;

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Internal server error",
      });
    });
  });

  describe("with options", () => {
    it("should use both custom defaults", () => {
      const error = "Custom error";

      const opts: ErrorToJsonOpts = {
        defaultStatusCode: 418,
        defaultError: "Fallback message",
      };

      const result = errorToJson(error, opts);

      expect(result).toEqual({
        statusCode: 418,
        error: "Custom error",
      });
    });

    it("should fall back to defaultError when errorToString returns undefined", () => {
      const error = Symbol("test");

      const opts: ErrorToJsonOpts = {
        defaultStatusCode: 503,
        defaultError: "Service unavailable",
      };

      const result = errorToJson(error, opts);

      expect(result).toEqual({
        statusCode: 503,
        error: "Service unavailable",
      });
    });

    it("should handle empty options object", () => {
      const error = new Error("Test error");

      const result = errorToJson(error, {});

      expect(result).toEqual({
        statusCode: 500,
        error: "Test error",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle Error with empty message", () => {
      const error = new Error("");

      const result = errorToJson(error);

      expect(result).toEqual({
        statusCode: 500,
        error: "Internal server error",
      });
    });

    it("should handle VaultError with empty message", () => {
      const vaultError = new VaultError({
        message: "",
        statusCode: 400,
      });

      const result = errorToJson(vaultError);

      expect(result).toEqual({
        statusCode: 400,
        error: "Internal server error",
      });
    });

    it("should handle nested errors properly", () => {
      const deepCause = new Error("Deep cause");
      const middleCause = new Error("Middle cause", { cause: deepCause });
      const mainError = new Error("Main error", { cause: middleCause });

      const result = errorToJson(mainError);

      expect(result).toEqual({
        statusCode: 500,
        error: "Main error: Middle cause",
      });
    });
  });

  describe("return type validation", () => {
    it("should return correct type structure", () => {
      const error = new Error("Type test");

      const result: ErrorToJsonOutput = errorToJson(error);

      expect(typeof result.statusCode).toBe("number");
      expect(typeof result.error).toBe("string");
      expect(Object.keys(result)).toEqual(["statusCode", "error"]);
    });
  });
});
