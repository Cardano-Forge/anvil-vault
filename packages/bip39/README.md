# @anvil-vault/bip39

BIP-39 mnemonic utilities for Anvil Vault. This package provides deterministic mnemonic phrase generation and entropy parsing compliant with the [BIP-39 standard](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki), used across major blockchain wallets.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [API Reference](#api-reference)
  - [generateMnemonic](#generatemnemonicinput)
  - [parseEntropy](#parseentropyinput)
  - [Wordlist Utilities](#wordlist-utilities)
    - [getWordList](#getwordlistlanguage)
    - [builtinWordLists](#builtinwordlists)
    - [defaultWordList](#defaultwordlist)
    - [wordListLength](#wordlistlength)
- [Complete Example: Generate and Parse](#complete-example-generate-and-parse)
- [Error Handling](#error-handling)
- [Specification](#specification)
- [Dependencies](#dependencies)

## Installation

```bash
npm install @anvil-vault/bip39
```

## Overview

The `bip39` package implements:

- **Mnemonic Generation**: Create 12- or 24-word mnemonic phrases from secure entropy.
- **Entropy Parsing**: Convert mnemonic phrases back into their underlying entropy.
- **Wordlist Utilities**: Access and validate BIP-39 wordlists in multiple languages.

It is designed for deterministic wallet creation and seed validation within the Anvil Vault ecosystem.

---

## API Reference

### `generateMnemonic(input?)`

Generates a new mnemonic phrase based on the specified or default wordlist.

**Parameters:**

- `input.wordCount?: 12 | 24` - Number of words in the mnemonic. Defaults to 24.
- `input.wordList?: BuiltinWordList | WordList` - Language or custom list of words. Defaults to English.

```typescript
type GenerateMnemonicInput = {
  wordCount?: 24 | 12;
  wordList?: BuiltinWordList | WordList;
};
```

**Returns:** `Result<GenerateMnemonicOutput>`

```typescript
export type GenerateMnemonicOutput = {
  mnemonic: Mnemonic; // The generated phrase.
  wordList: WordList; // The actual wordlist used for generation.
};
```

**Example:**

```typescript
import { generateMnemonic } from "@anvil-vault/bip39";
import { isErr, unwrap } from "trynot";

const result = generateMnemonic({ wordCount: 12 });

if (!isErr(result)) {
  console.log("Mnemonic:", result.mnemonic);
}

// or using unwrap
const { mnemonic } = unwrap(generateMnemonic());
console.log(mnemonic.split(" ").length); // 24 words
```

#### `parseEntropy(input)`

Converts a mnemonic phrase back into entropy while validating the wordlist and checksum.

**Parameters:**

- `input.mnemonic: string` - The mnemonic phrase to parse.
- `input.wordList?: BuiltinWordList | WordList` - Optional wordlist to validate against. Defaults to English.

```typescript
type ParseEntropyInput = {
  mnemonic: string;
  wordList?: BuiltinWordList | WordList;
};
```

**Returns:** `Result<ParseEntropyOutput>`

```typescript
export type ParseEntropyOutput = {
  entropy: string; // The derived entropy (hex string).
  wordList: WordList; // The resolved wordlist.
};
```

**Example:**

```typescript
import { parseEntropy } from "@anvil-vault/bip39";
import { isErr, unwrap } from "trynot";

const mnemonic =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const result = parseEntropy({ mnemonic });

if (!isErr(result)) {
  console.log("Entropy:", result.entropy);
}

// unwrap will throw if invalid
const { entropy } = unwrap(parseEntropy({ mnemonic }));
console.log(entropy); // "00000000000000000000000000000000"
```

---

## Wordlist Utilities

### `getWordList(language)`

Retrieves a built-in or custom wordlist. If an invalid list or unsupported language is provided, returns an error.

**Parameters:**

- `language: BuiltinWordList | WordList` - Wordlist name (e.g. `"english"`) or custom list array.

**Returns:** `Result<WordList>`

**Example:**

```typescript
import { getWordList, builtinWordLists } from "@anvil-vault/bip39";
import { unwrap } from "trynot";

console.log(builtinWordLists); // ["english", "japanese", "spanish", ...]

const wordList = unwrap(getWordList("english"));
console.log(wordList.length); // 2048
```

### `builtinWordLists`

Array of supported built-in BIP-39 language codes:

```typescript
[
  "english",
  "japanese",
  "korean",
  "spanish",
  "chinese_simplified",
  "chinese_traditional",
  "french",
  "italian",
  "czech",
  "portuguese",
];
```

### `defaultWordList`

Default wordlist used for generation and parsing (`"english"`).

### `wordListLength`

Number of words expected in a standard BIP-39 wordlist (2048).

---

## Complete Example: Generate and Parse

```typescript
import { generateMnemonic, parseEntropy } from "@anvil-vault/bip39";
import { unwrap } from "trynot";

// 1. Generate a mnemonic
const { mnemonic } = unwrap(generateMnemonic({ wordCount: 12 }));
console.log("Mnemonic:", mnemonic);

// 2. Parse it back into entropy
const { entropy } = unwrap(parseEntropy({ mnemonic }));
console.log("Entropy:", entropy);
```

This example demonstrates the full round-trip conversion between entropy and mnemonic using the default English wordlist.

---

## Error Handling

All functions return `Result` objects from the `trynot` library. Errors are non-throwing by default unless unwrapped.

```typescript
import { generateMnemonic } from "@anvil-vault/bip39";
import { isErr, unwrap } from "trynot";

const result = generateMnemonic({ wordList: "unsupported" });

if (isErr(result)) {
  console.error(result.message); // "Unsupported language: unsupported"
}

// Unwrap throws on error
unwrap(result); // throws Error
```

---

## Specification

Implements the [BIP-39: Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) standard.

**References:**

- [BIP-39 Wordlists](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt)

---

## Dependencies

- **`trynot`**: Result type for error handling

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/RN4D7wzc">Discord</a>
  |
  <a href="https://x.com/ada_anvil">@ada_anvil</a>
</p>
