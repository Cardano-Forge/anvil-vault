import { type Result, isErr } from "trynot";

export class ValidationError extends Error {
  public path: string[];
  private readonly _message: string;

  constructor(message: string, opts?: { path?: string[] }) {
    super();
    this.name = "ValidationError";
    this.path = opts?.path ?? [];
    this._message = message;
  }

  get message(): string {
    if (this.path.length === 0) {
      return this._message;
    }
    return `${this.path.join(".")}: ${this._message}`;
  }

  withPath(path: string | string[]): ValidationError {
    const pathArr = Array.isArray(path) ? path : [path];
    return new ValidationError(this._message, { path: [...pathArr, ...this.path] });
  }
}

// biome-ignore lint/suspicious/noExplicitAny: any schema is valid
export type Schema<T = any> = {
  parse: (value: unknown) => Result<T, ValidationError>;
};

export function stringSchema(): Schema<string>;
export function stringSchema(opts: { optional: true }): Schema<string | undefined>;
export function stringSchema(opts: { optional?: false }): Schema<string>;
export function stringSchema(opts?: { optional?: boolean }): Schema<string | undefined> {
  return {
    parse: (value: unknown) => {
      if (typeof value === "string") {
        return value;
      }
      if (value === undefined && opts?.optional) {
        return undefined;
      }
      return new ValidationError(`Expected a string, received ${typeof value}`);
    },
  };
}

export type ParsedSchema<T> = T extends Schema<infer U>
  ? U
  : T extends Record<string, Schema>
    ? { [K in keyof T]: ParsedSchema<T[K]> }
    : never;

export function objectSchema<T extends Record<string, Schema>>(record: T): Schema<ParsedSchema<T>> {
  return {
    parse: (value: unknown) => {
      if (typeof value !== "object") {
        return new ValidationError(`Expected an object, received ${typeof value}`);
      }
      if (value === null) {
        return new ValidationError("Expected an object, received null");
      }
      const obj = {} as ParsedSchema<T>;
      for (const [key, schema] of Object.entries(record)) {
        const res = schema.parse(value[key as keyof typeof value]);
        if (isErr(res)) {
          return res.withPath(key);
        }
        obj[key as keyof typeof obj] = res as ParsedSchema<T>[keyof ParsedSchema<T>];
      }
      return obj;
    },
  };
}
