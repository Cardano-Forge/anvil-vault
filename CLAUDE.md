# Anvil Vault - Claude Development Guide

## Project Overview

Anvil Vault is a TypeScript monorepo containing shared packages and tools for the Anvil ecosystem. It provides core building blocks including CSL (Cardano Serialization Library) wrappers, signing, and private key handling
- **tsconfig**: Shared TypeScript configuration for Node.js 20
- **tsup**: Build configuration utilities for bundling packages

## Development Commands

```bash
# Setup
npm install
npm run pre

# Building
npm run build             # Build all packages
npm run emit             # Emit TypeScript declarations

# Code Quality
npm run lint             # Run Biome linting and formatting
npm run check            # Run TypeScript type checking
npm run pre              # Run lint + check + test (pre-commit)

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode testing

# Cleanup
npm run build:clean      # Clean build artifacts
```

## Package Structure

Each package follows a consistent structure:

```
packages/[name]/
├── src/                # Source TypeScript files (with co-located .test.ts files)
├── dist/               # Build output
├── out/                # Published package output
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
├── build.tsup.ts       # Build configuration
└── emit.tsup.ts        # Declaration emit configuration
```

## Code Conventions

- **TypeScript**: Strict mode enabled
- **Formatting**: Biome configuration in `biome.json`
- **Architecture**: Packages are self-contained with minimal coupling
- **Testing**: Uses Vitest for unit testing with test files co-located alongside source files using `.test.ts` extension
  - Always use trynot's `assert()` function instead of non-null assertions (`!`) in tests for safer null checking
  - After using `assert(isOk(value))` or `assert(isErr(value))`, you can access the value directly without `unwrap()` since TypeScript knows the type
- **Build**: Uses tsup for bundling and TypeScript for declarations
- **Exports**: Packages provide both CommonJS and ESM builds
- **Error Handling**: Uses `trynot` library for error handling patterns
- **Runtime Validation**: Always use Zod for runtime type validation instead of type casting

## Runtime Validation with Zod

**Always validate data at runtime instead of assuming types or using type casting.**

```typescript
// ✅ Good - Runtime validation
const userInput = z.object({
  name: z.string(),
  age: z.coerce.number(),
  email: z.string().email()
}).parse(req.body);

// ❌ Bad - Type casting without validation
const userInput = req.body as { name: string; age: number; email: string };
```

## Error Handling with Trynot

**Use `trynot` for consistent error handling without wrapping results.**

### Key Concepts

- **No Result Wrapping**: Functions return values directly
- **Simple Error Creation**: Use `err()` from `@ada-anvil/utils` for generic errors
- **Direct Checking**: Use `isOk()` to check if a value is a successful result
- **Direct Checking**: Use `isErr()` to check if a value is an error
 **Safe Unwrapping**: Use `unwrap()` to get values or throw on errors
- **Make uncontrolled code safe**: Use `wrap()` to wrap values from other libraries to prevent them from throwing and return errors instead
- **Unwrap short hands**:
    - Use `unwrapOr()` to return a default value in case of an error;
    - `unwrapOrElse()` to execute a function with the error and return the result in case of an error;
    - `unwrapOrUndefined()` to return `undefined` in case of an error;
- **Extracting error message**: Use `getFailureReason(error)` to get the error message from an unknown error. It works for errors, objects, string, and other types.
- **Parsing errors**: Use `parseError()` to parse any unknown error into a `Error` instance.

```typescript
import { err } from "@ada-anvil/utils";
import { isErr, unwrap } from "trynot";

// ✅ Good - Direct return, no wrapping
function parseAddress(address: string): Result<Address> {
  try {
    return Address.from_bech32(address);
  } catch (error) {
    return err(error, "Invalid address format");
  }
}

// Usage
const address = parseAddress(userInput);
if (isErr(address)) {
  throw new Error(address.message);
}

// Or use unwrap to throw immediately on error
const safeAddress = unwrap(parseAddress(userInput));
```

### Specific Error Instances

When returning custom `Error` instances, you can specify the error type:

**Note:** Custom error types must extend `Error` because trynot uses `instanceof Error` to check for errors.

```typescript
class MyError extends Error {}

function findUser(id: string): Result<User, MyError> {
  const user = database.find(id);
  if (!user) {
    return new MyError(`User ${id} not found`);
  }
  return user;
}

## Development Tips

- Each package is independently buildable
- Use `npm run emit` to generate TypeScript declarations
- Run `npm run pre` before committing changes
- Follow existing patterns when adding new packages
- Keep packages focused and minimize dependencies
- Use Turbo for efficient parallel builds

## Important Files

- `turbo.json`: Build pipeline configuration with task dependencies
- `biome.json`: Code formatting and linting rules
- `package.json`: Root workspace configuration with shared scripts
