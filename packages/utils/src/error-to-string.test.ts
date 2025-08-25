import { describe, expect, it } from "vitest";
import { errorToString } from "./error-to-string";

describe("errorToString", () => {
  it("should return string as-is when error is a string", () => {
    const result = errorToString("simple error message");
    expect(result).toBe("simple error message");
  });

  it("should return extract message from error-like object", () => {
    const result = errorToString({ message: "not an error" });
    expect(result).toBe("not an error");
  });

  it("should return undefined for null", () => {
    const result = errorToString(null);
    expect(result).toBeUndefined();
  });

  it("should return undefined for numbers", () => {
    const result = errorToString(42);
    expect(result).toBeUndefined();
  });

  it("should return error message for simple Error", () => {
    const error = new Error("test error");
    const result = errorToString(error);
    expect(result).toBe("test error");
  });

  it("should return undefined for Error with no message", () => {
    const error = new Error("");
    const result = errorToString(error);
    expect(result).toBeUndefined();
  });

  it("should include cause by default", () => {
    const cause = new Error("root cause");
    const error = new Error("main error", { cause });
    const result = errorToString(error);
    expect(result).toBe("main error: root cause");
  });

  it("should exclude cause when opts.cause is false", () => {
    const cause = new Error("root cause");
    const error = new Error("main error", { cause });
    const result = errorToString(error, { cause: false });
    expect(result).toBe("main error");
  });

  it("should include string cause", () => {
    const error = new Error("main error", { cause: "string cause" });
    const result = errorToString(error);
    expect(result).toBe("main error: string cause");
  });

  it("should return error message when cause has no message", () => {
    const cause = new Error("");
    const error = new Error("main error", { cause });
    const result = errorToString(error);
    expect(result).toBe("main error");
  });

  it("should recursively handle duplicate messages", () => {
    const deepCause = new Error("deep error");
    const middleCause = new Error("same message", { cause: deepCause });
    const error = new Error("same message", { cause: middleCause });
    const result = errorToString(error);
    expect(result).toBe("same message: deep error");
  });

  it("should handle deeply nested causes with same message", () => {
    const deepestCause = new Error("final error");
    const cause3 = new Error("duplicate", { cause: deepestCause });
    const cause2 = new Error("duplicate", { cause: cause3 });
    const cause1 = new Error("duplicate", { cause: cause2 });
    const error = new Error("duplicate", { cause: cause1 });
    const result = errorToString(error);
    expect(result).toBe("duplicate: final error");
  });

  it("should stop recursion when reaching undefined cause", () => {
    const cause = new Error("same message", { cause: undefined });
    const error = new Error("same message", { cause });
    const result = errorToString(error);
    expect(result).toBe("same message");
  });

  it("should handle Error with undefined message", () => {
    const error = new Error(undefined as unknown as string);
    const result = errorToString(error);
    expect(result).toBeUndefined();
  });

  it("should handle opts.cause explicitly set to true", () => {
    const cause = new Error("root cause");
    const error = new Error("main error", { cause });
    const result = errorToString(error, { cause: true });
    expect(result).toBe("main error: root cause");
  });
});
