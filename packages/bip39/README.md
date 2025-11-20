# @anvil-vault/bip39

BIP-39 mnemonic utilities for Anvil Vault. This package provides deterministic mnemonic phrase generation and entropy parsing compliant with the [BIP-39 standard](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki).

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [generateMnemonic](#generatemnemonicinput)
  - [parseEntropy](#parseentropyinput)
  - [Wordlist Utilities](#wordlist-utilities)
    - [getWordList](#getwordlistlanguage)
    - [builtinWordLists](#builtinwordlists)
    - [defaultWordList](#defaultwordlist)
    - [wordListLength](#wordlistlength)
- [Specification](#specification)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/bip39
```

## Overview

The `@anvil-vault/bip39` package provides:

- **Mnemonic Generation**: Create BIP-39 mnemonics from entropy or word count
- **Entropy Parsing**: Convert mnemonics back to entropy
- **Multi-language Support**: English, Spanish, French, Italian, Portuguese, Czech, Japanese, Korean, Chinese (Simplified & Traditional)
- **Validation**: Automatic checksum validation
- **Flexible Input**: Support for hex strings and Buffers

All functions return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

## Quick Start

```typescript
import { generateMnemonic, parseEntropy } from "@anvil-vault/bip39";
import { isOk } from "trynot";

// Generate a 24-word mnemonic
const result = generateMnemonic({ wordCount: 24 });

if (isOk(result)) {
  console.log("Mnemonic:", result.mnemonic);
}

// Parse mnemonic back to entropy
const entropyResult = parseEntropy({ mnemonic: result.mnemonic });

if (isOk(entropyResult)) {
  console.log("Entropy:", entropyResult.entropy);
}
```

---

## API Reference

### `generateMnemonic(input?)`

Generates a new mnemonic phrase based on the specified or default wordlist.

**Parameters:**

- `input.wordCount?: 12 | 24` - Number of words in the mnemonic. Defaults to 24.
- `input.wordList?: BuiltinWordList | WordList` - Language or custom list of words. Defaults to English.

```typescript
type GenerateMnemonicInput = {
  wordCount?: 12 | 24;
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
import { isOk } from "trynot";

const result = generateMnemonic({ wordCount: 12 });

if (isOk(result)) {
  console.log("Mnemonic:", result.mnemonic);
}
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
import { isOk } from "trynot";

const mnemonic =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const result = parseEntropy({ mnemonic });

if (isOk(result)) {
  console.log("Entropy:", result.entropy);
}
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
import { getWordList } from "@anvil-vault/bip39";
import { unwrap } from "trynot";

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

## Specification

Implements the [BIP-39: Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) standard.

**References:**

- [BIP-39 Wordlists](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt)

---

## Dependencies

- **`trynot`**: Result type for error handling

## Related Packages

- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/utils](../utils/README.md)**: Shared utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord Invite</a>
  |
  <a href="https://x.com/AnvilDevAgency">X: @AnvilDevAgency</a>
</p>
