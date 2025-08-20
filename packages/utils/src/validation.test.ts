import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { type ParsedSchema, ValidationError, objectSchema, stringSchema } from "./validation";

describe("ValidationError", () => {
  it("should create error with message and default empty path", () => {
    const error = new ValidationError("test message");
    expect(error.message).toBe("test message");
    expect(error.name).toBe("ValidationError");
    expect(error.path).toEqual([]);
    expect(error instanceof Error).toBe(true);
  });

  it("should create error with custom path", () => {
    const error = new ValidationError("test message", { path: ["field", "nested"] });
    expect(error.message).toBe("test message");
    expect(error.path).toEqual(["field", "nested"]);
  });

  describe("withPath", () => {
    it("should add single path element to front of path array", () => {
      const originalError = new ValidationError("test message", { path: ["nested", "field"] });
      const newError = originalError.withPath("parent");

      expect(newError.message).toBe("test message");
      expect(newError.path).toEqual(["parent", "nested", "field"]);
      expect(originalError.path).toEqual(["nested", "field"]); // Original unchanged
    });

    it("should add multiple path elements to front of path array", () => {
      const originalError = new ValidationError("test message", { path: ["field"] });
      const newError = originalError.withPath(["root", "parent"]);

      expect(newError.message).toBe("test message");
      expect(newError.path).toEqual(["root", "parent", "field"]);
    });

    it("should work with empty initial path", () => {
      const originalError = new ValidationError("test message");
      const newError = originalError.withPath("root");

      expect(newError.message).toBe("test message");
      expect(newError.path).toEqual(["root"]);
      expect(originalError.path).toEqual([]); // Original unchanged
    });

    it("should create new instance, not modify original", () => {
      const originalError = new ValidationError("test message", { path: ["original"] });
      const newError = originalError.withPath("new");

      expect(originalError).not.toBe(newError);
      expect(originalError.path).toEqual(["original"]);
      expect(newError.path).toEqual(["new", "original"]);
    });

    it("should handle empty array path", () => {
      const originalError = new ValidationError("test message", { path: ["field"] });
      const newError = originalError.withPath([]);

      expect(newError.message).toBe("test message");
      expect(newError.path).toEqual(["field"]);
    });
  });
});

describe("stringSchema", () => {
  describe("required string schema", () => {
    const schema = stringSchema();

    it("should parse valid string", () => {
      const result = schema.parse("hello");
      assert(isOk(result));
      expect(result).toBe("hello");
    });

    it("should handle empty string", () => {
      const result = schema.parse("");
      assert(isOk(result));
      expect(result).toBe("");
    });

    it("should reject undefined", () => {
      const result = schema.parse(undefined);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received undefined");
    });

    it("should reject null", () => {
      const result = schema.parse(null);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received object");
    });

    it("should reject numbers", () => {
      const result = schema.parse(42);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received number");
    });

    it("should reject booleans", () => {
      const result = schema.parse(true);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received boolean");
    });

    it("should reject objects", () => {
      const result = schema.parse({});
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received object");
    });
  });

  describe("optional string schema", () => {
    const schema = stringSchema({ optional: true });

    it("should parse valid string", () => {
      const result = schema.parse("hello");
      assert(isOk(result));
      expect(result).toBe("hello");
    });

    it("should accept undefined", () => {
      const result = schema.parse(undefined);
      assert(isOk(result));
      expect(result).toBeUndefined();
    });

    it("should reject null", () => {
      const result = schema.parse(null);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received object");
    });

    it("should reject numbers", () => {
      const result = schema.parse(42);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received number");
    });
  });

  describe("explicitly non-optional string schema", () => {
    const schema = stringSchema({ optional: false });

    it("should parse valid string", () => {
      const result = schema.parse("hello");
      assert(isOk(result));
      expect(result).toBe("hello");
    });

    it("should reject undefined", () => {
      const result = schema.parse(undefined);
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received undefined");
    });
  });
});

describe("objectSchema", () => {
  it("should parse valid object with string fields", () => {
    const schema = objectSchema({
      name: stringSchema(),
      email: stringSchema(),
    });

    const result = schema.parse({ name: "John", email: "john@example.com" });
    assert(isOk(result));
    expect(result).toEqual({ name: "John", email: "john@example.com" });
  });

  it("should parse object with optional fields", () => {
    const schema = objectSchema({
      name: stringSchema(),
      nickname: stringSchema({ optional: true }),
    });

    const result = schema.parse({ name: "John" });
    assert(isOk(result));
    expect(result).toEqual({ name: "John", nickname: undefined });
  });

  it("should handle mixed optional and required fields", () => {
    const schema = objectSchema({
      name: stringSchema(),
      nickname: stringSchema({ optional: true }),
      email: stringSchema(),
    });

    const result = schema.parse({
      name: "John",
      nickname: "Johnny",
      email: "john@example.com",
    });
    assert(isOk(result));
    expect(result).toEqual({
      name: "John",
      nickname: "Johnny",
      email: "john@example.com",
    });
  });

  it("should reject non-object values", () => {
    const schema = objectSchema({
      name: stringSchema(),
    });

    const result = schema.parse("not an object");
    assert(isErr(result));
    expect(result.message).toBe("Expected an object, received string");
  });

  it("should reject null", () => {
    const schema = objectSchema({
      name: stringSchema(),
    });

    const result = schema.parse(null);
    assert(isErr(result));
    expect(result.message).toBe("Expected an object, received null");
  });

  it("should reject undefined", () => {
    const schema = objectSchema({
      name: stringSchema(),
    });

    const result = schema.parse(undefined);
    assert(isErr(result));
    expect(result.message).toBe("Expected an object, received undefined");
  });

  it("should return first validation error encountered", () => {
    const schema = objectSchema({
      name: stringSchema(),
      age: stringSchema(),
    });

    const result = schema.parse({ name: 123, age: 456 });
    assert(isErr(result));
    expect(result.message).toBe("Expected a string, received number");
  });

  it("should handle missing required fields", () => {
    const schema = objectSchema({
      name: stringSchema(),
      email: stringSchema(),
    });

    const result = schema.parse({ name: "John" });
    assert(isErr(result));
    expect(result.message).toBe("Expected a string, received undefined");
  });

  it("should handle extra fields in input object", () => {
    const schema = objectSchema({
      name: stringSchema(),
    });

    const result = schema.parse({ name: "John", extra: "field" });
    assert(isOk(result));
    expect(result).toEqual({ name: "John" });
  });

  describe("path error propagation", () => {
    it("should include field name in error path for validation failures", () => {
      const schema = objectSchema({
        name: stringSchema(),
        email: stringSchema(),
      });

      const result = schema.parse({ name: "John", email: 123 });
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received number");
      expect(result.path).toEqual(["email"]);
    });

    it("should include field name in error path for missing required field", () => {
      const schema = objectSchema({
        name: stringSchema(),
        email: stringSchema(),
      });

      const result = schema.parse({ name: "John" });
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received undefined");
      expect(result.path).toEqual(["email"]);
    });

    it("should propagate path for first error encountered", () => {
      const schema = objectSchema({
        name: stringSchema(),
        age: stringSchema(),
        email: stringSchema(),
      });

      const result = schema.parse({ name: 123, age: 456, email: "test@example.com" });
      assert(isErr(result));
      expect(result.message).toBe("Expected a string, received number");
      expect(result.path).toEqual(["name"]);
    });

    it("should handle different field validation errors with correct paths", () => {
      const schema = objectSchema({
        username: stringSchema(),
        password: stringSchema(),
      });

      // Test username error
      const usernameResult = schema.parse({ username: null, password: "secret" });
      assert(isErr(usernameResult));
      expect(usernameResult.message).toBe("Expected a string, received object");
      expect(usernameResult.path).toEqual(["username"]);

      // Test password error
      const passwordResult = schema.parse({ username: "user", password: 123 });
      assert(isErr(passwordResult));
      expect(passwordResult.message).toBe("Expected a string, received number");
      expect(passwordResult.path).toEqual(["password"]);
    });
  });
});

describe("nested object validation with path tracking", () => {
  it("should track nested object paths correctly", () => {
    const userSchema = objectSchema({
      name: stringSchema(),
      email: stringSchema(),
    });

    const requestSchema = objectSchema({
      user: userSchema,
      timestamp: stringSchema(),
    });

    const result = requestSchema.parse({
      user: { name: "John", email: 123 },
      timestamp: "2023-01-01",
    });

    assert(isErr(result));
    expect(result.message).toBe("Expected a string, received number");
    expect(result.path).toEqual(["user", "email"]);
  });

  it("should handle deeply nested validation errors", () => {
    const addressSchema = objectSchema({
      street: stringSchema(),
      city: stringSchema(),
    });

    const userSchema = objectSchema({
      name: stringSchema(),
      address: addressSchema,
    });

    const requestSchema = objectSchema({
      data: userSchema,
      meta: stringSchema(),
    });

    const result = requestSchema.parse({
      data: {
        name: "John",
        address: {
          street: "Main St",
          city: null,
        },
      },
      meta: "info",
    });

    assert(isErr(result));
    expect(result.message).toBe("Expected a string, received object");
    expect(result.path).toEqual(["data", "address", "city"]);
  });

  it("should handle missing nested required fields", () => {
    const profileSchema = objectSchema({
      bio: stringSchema(),
      avatar: stringSchema(),
    });

    const userSchema = objectSchema({
      name: stringSchema(),
      profile: profileSchema,
    });

    const result = userSchema.parse({
      name: "John",
      profile: { bio: "Developer" },
    });

    assert(isErr(result));
    expect(result.message).toBe("Expected a string, received undefined");
    expect(result.path).toEqual(["profile", "avatar"]);
  });

  it("should handle nested objects with optional fields", () => {
    const metaSchema = objectSchema({
      version: stringSchema(),
      debug: stringSchema({ optional: true }),
    });

    const configSchema = objectSchema({
      name: stringSchema(),
      meta: metaSchema,
    });

    // Should succeed with undefined optional field
    const successResult = configSchema.parse({
      name: "MyApp",
      meta: { version: "1.0.0" },
    });

    assert(isOk(successResult));
    expect(successResult).toEqual({
      name: "MyApp",
      meta: { version: "1.0.0", debug: undefined },
    });

    // Should fail on invalid required field
    const errorResult = configSchema.parse({
      name: "MyApp",
      meta: { version: 123 },
    });

    assert(isErr(errorResult));
    expect(errorResult.message).toBe("Expected a string, received number");
    expect(errorResult.path).toEqual(["meta", "version"]);
  });

  it("should handle errors at different nesting levels", () => {
    const innerSchema = objectSchema({
      value: stringSchema(),
    });

    const outerSchema = objectSchema({
      inner: innerSchema,
      direct: stringSchema(),
    });

    // Test error at outer level
    const outerError = outerSchema.parse({
      inner: { value: "test" },
      direct: 123,
    });

    assert(isErr(outerError));
    expect(outerError.path).toEqual(["direct"]);

    // Test error at inner level
    const innerError = outerSchema.parse({
      inner: { value: 456 },
      direct: "test",
    });

    assert(isErr(innerError));
    expect(innerError.path).toEqual(["inner", "value"]);
  });
});

describe("ParsedSchema type inference", () => {
  it("should infer correct types for simple schemas", () => {
    const stringSchemaInstance = stringSchema();
    const optionalStringSchemaInstance = stringSchema({ optional: true });

    type StringType = ParsedSchema<typeof stringSchemaInstance>;
    type OptionalStringType = ParsedSchema<typeof optionalStringSchemaInstance>;

    // Type assertions to verify correct inference
    const stringValue: StringType = "hello";
    const optionalStringValue1: OptionalStringType = "hello";
    const optionalStringValue2: OptionalStringType = undefined;

    expect(stringValue).toBe("hello");
    expect(optionalStringValue1).toBe("hello");
    expect(optionalStringValue2).toBeUndefined();
  });

  it("should infer correct types for object schemas", () => {
    const schema = objectSchema({
      name: stringSchema(),
      nickname: stringSchema({ optional: true }),
      email: stringSchema(),
    });

    type ObjectType = ParsedSchema<typeof schema>;

    const validObject: ObjectType = {
      name: "John",
      nickname: "Johnny",
      email: "john@example.com",
    };

    const validObjectWithUndefined: ObjectType = {
      name: "John",
      nickname: undefined,
      email: "john@example.com",
    };

    expect(validObject.name).toBe("John");
    expect(validObject.nickname).toBe("Johnny");
    expect(validObject.email).toBe("john@example.com");
    expect(validObjectWithUndefined.nickname).toBeUndefined();
  });
});
