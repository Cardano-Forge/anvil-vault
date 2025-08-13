import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { generateMnemonic } from "./generate-wallet-mnemonic";
import { mnemonicToEntropy } from "./mnemonic-to-entropy";
import { type BuiltinWordList, defaultWordList, getWordList, wordListLength } from "./wordlists";

describe("mnemonicToEntropy", () => {
  it("should convert a valid 24-word mnemonic to entropy", () => {
    const generateResult = generateMnemonic({ wordCount: 24 });
    assert(isOk(generateResult));

    const [mnemonic, wordList] = generateResult;
    const result = mnemonicToEntropy({ mnemonic });
    assert(isOk(result));

    const [entropy, returnedWordList] = result;

    expect(typeof entropy).toBe("string");
    expect(entropy).toHaveLength(64); // 256 bits = 64 hex characters
    expect(returnedWordList).toBe(wordList);
  });

  it("should convert a valid 12-word mnemonic to entropy", () => {
    const generateResult = generateMnemonic({ wordCount: 12 });
    assert(isOk(generateResult));

    const [mnemonic, wordList] = generateResult;
    const result = mnemonicToEntropy({ mnemonic });
    assert(isOk(result));

    const [entropy, returnedWordList] = result;

    expect(typeof entropy).toBe("string");
    expect(entropy).toHaveLength(32); // 128 bits = 32 hex characters
    expect(returnedWordList).toBe(wordList);
  });

  it("should work with different word lists", () => {
    const wordLists = ["english", "japanese", "french", "spanish"] satisfies BuiltinWordList[];

    for (const wordListType of wordLists) {
      const generateResult = generateMnemonic({ wordList: wordListType });
      assert(isOk(generateResult));

      const [mnemonic] = generateResult;
      const result = mnemonicToEntropy({ mnemonic, wordList: wordListType });
      assert(isOk(result));

      const [entropy, returnedWordList] = result;

      expect(typeof entropy).toBe("string");
      expect(entropy).toHaveLength(64);
      expect(returnedWordList).toBe(getWordList(wordListType));
    }
  });

  it("should use default word list when not specified", () => {
    const generateResult = generateMnemonic();
    assert(isOk(generateResult));

    const [mnemonic] = generateResult;
    const result = mnemonicToEntropy({ mnemonic });
    assert(isOk(result));

    const [entropy, wordList] = result;

    expect(typeof entropy).toBe("string");
    expect(wordList).toBe(getWordList(defaultWordList));
  });

  it("should return error for invalid mnemonic", () => {
    const result = mnemonicToEntropy({ mnemonic: "invalid mnemonic phrase" });
    expect(isErr(result)).toBe(true);
  });

  it("should return error for empty mnemonic", () => {
    const result = mnemonicToEntropy({ mnemonic: "" });
    expect(isErr(result)).toBe(true);
  });

  it("should return error for mnemonic with wrong word count", () => {
    const result = mnemonicToEntropy({ mnemonic: "abandon abandon abandon" });
    expect(isErr(result)).toBe(true);
  });

  it("should return error for mnemonic with invalid words", () => {
    const invalidMnemonic =
      "invalid word list test mnemonic phrase with wrong words here now check this entropy conversion failure case";
    const result = mnemonicToEntropy({ mnemonic: invalidMnemonic });
    expect(isErr(result)).toBe(true);
  });

  it("should work with custom word list array", () => {
    const customWordList = Array.from({ length: wordListLength }, (_, i) => `word${i}`);
    const generateResult = generateMnemonic({ wordList: customWordList });
    assert(isOk(generateResult));

    const [mnemonic, wordList] = generateResult;
    expect(wordList).toBe(customWordList);
    const result = mnemonicToEntropy({ mnemonic, wordList });
    assert(isOk(result));

    const [entropy, returnedWordList] = result;

    expect(typeof entropy).toBe("string");
    expect(returnedWordList).toBe(customWordList);
  });

  it("should return consistent entropy for same mnemonic", () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

    const result1 = mnemonicToEntropy({ mnemonic });
    const result2 = mnemonicToEntropy({ mnemonic });

    assert(isOk(result1));
    assert(isOk(result2));

    const [entropy1] = result1;
    const [entropy2] = result2;

    expect(entropy1).toBe(entropy2);
  });
});
