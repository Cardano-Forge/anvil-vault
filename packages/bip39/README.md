# @ada-anvil/vault/bip39

This package provides deterministic mnemonic phrase generation and entropy parsing compliant with the [BIP-39 standard](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki).

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Overview](#overview)
- [Functions](#functions)
  - [generateMnemonic](#generatemnemonicinput)
  - [parseEntropy](#parseentropyinput)
  - [getWordList](#getwordlistlanguage)
- [Specification](#specification)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Overview

The `@ada-anvil/vault/bip39` package provides:

- **Mnemonic Generation**: Create BIP-39 mnemonics from entropy or word count
- **Entropy Parsing**: Convert mnemonics back to entropy
- **Multi-language Support**: English, Spanish, French, Italian, Portuguese, Czech, Japanese, Korean, Chinese (Simplified & Traditional)
- **Validation**: Automatic checksum validation

All functions return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

---

## Functions

### `generateMnemonic(input?)`

Generates a new mnemonic phrase based on the specified or default wordlist.

**Input:**

```typescript
type GenerateMnemonicInput = {
  wordCount?: 12 | 24; // Number of words in the mnemonic. Defaults to 24.
  wordList?: BuiltinWordList | WordList; //Language or custom list of words. Defaults to English.
};
```

**Returns:** `Result<GenerateMnemonicOutput>`

```typescript
type GenerateMnemonicOutput = {
  mnemonic: Mnemonic; // The generated phrase.
  wordList: WordList; // The actual wordlist used for generation.
};
```

**Example:**

```typescript
import { generateMnemonic } from "@ada-anvil/vault/bip39";
import { isOk } from "trynot";

const result = generateMnemonic({ wordCount: 12 });

if (isOk(result)) {
  console.log("Mnemonic:", result.mnemonic);
}
```

---

### `parseEntropy(input)`

Converts a mnemonic phrase back into entropy while validating the wordlist and checksum.

**Input:**

```typescript
type ParseEntropyInput = {
  mnemonic: string; // The mnemonic phrase to parse.
  wordList?: BuiltinWordList | WordList; // Optional wordlist to validate against. Defaults to English.
};
```

**Returns:** `Result<ParseEntropyOutput>`

```typescript
type ParseEntropyOutput = {
  entropy: string; // The derived entropy (hex string).
  wordList: WordList; // The resolved wordlist.
};
```

**Example:**

```typescript
import { parseEntropy } from "@ada-anvil/vault/bip39";
import { isOk } from "trynot";

const mnemonic =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const result = parseEntropy({ mnemonic });

if (isOk(result)) {
  console.log("Entropy:", result.entropy);
}
```

---

### `getWordList(language)`

Retrieves a built-in or custom wordlist. If an invalid list or unsupported language is provided, returns an error.

**Parameters:**

`language: BuiltinWordList | WordList` - Wordlist name (e.g. `"english"`) or custom list array.

**Returns:** `Result<WordList>`

**Example:**

```typescript
import { getWordList } from "@ada-anvil/vault/bip39";
import { unwrap } from "trynot";

const wordList = unwrap(getWordList("english"));
console.log(wordList.length); // 2048
```

---

## Specification

Implements the [BIP-39: Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) standard.

Supported built-in BIP-39 language codes:

```typescript
const builtinWordLists = [
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

const defaultWordList = "english";

const wordListLength = 2048;
```

**References:** [BIP-39 Wordlists](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt)

---

## Dependencies

**`bip39`**: Peer dependency for BIP-39 mnemonic operations and wordlist management

---

## Related Packages

- **[@ada-anvil/vault/vault](../vault/README.md)**: Main vault implementation
- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@ada-anvil/vault/utils](../utils/README.md)**: Shared utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">
    <img src="../../logo/discord.svg" alt="Discord Icon" height="18px" style="vertical-align: text-top;" /> Discord
  </a>
  |
  <a href="https://x.com/AnvilDevAgency">
    <img src="../../logo/x.svg" alt="X Icon" height="18px" style="vertical-align: text-top;" /> @AnvilDevAgency
  </a>
</p>
