import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { generateMnemonic } from "./generate-mnemonic";
import { parseEntropy } from "./parse-entropy";
import { type BuiltinWordList, defaultWordList, getWordList, wordListLength } from "./wordlists";

describe("parseEntropy", () => {
  it("should convert a valid 24-word mnemonic to entropy", () => {
    const generateResult = generateMnemonic({ wordCount: 24 });
    assert(isOk(generateResult));

    const { mnemonic, wordList } = generateResult;
    const result = parseEntropy({ mnemonic });
    assert(isOk(result));

    const { entropy, wordList: returnedWordList } = result;

    expect(typeof entropy).toBe("string");
    expect(entropy).toHaveLength(64); // 256 bits = 64 hex characters
    expect(returnedWordList).toBe(wordList);
  });

  it("should convert a valid 12-word mnemonic to entropy", () => {
    const generateResult = generateMnemonic({ wordCount: 12 });
    assert(isOk(generateResult));

    const { mnemonic, wordList } = generateResult;
    const result = parseEntropy({ mnemonic });
    assert(isOk(result));

    const { entropy, wordList: returnedWordList } = result;

    expect(typeof entropy).toBe("string");
    expect(entropy).toHaveLength(32); // 128 bits = 32 hex characters
    expect(returnedWordList).toBe(wordList);
  });

  it("should work with different word lists", () => {
    const wordLists = ["english", "japanese", "french", "spanish"] satisfies BuiltinWordList[];

    for (const wordListType of wordLists) {
      const generateResult = generateMnemonic({ wordList: wordListType });
      assert(isOk(generateResult));

      const { mnemonic } = generateResult;
      const result = parseEntropy({ mnemonic, wordList: wordListType });
      assert(isOk(result));

      const { entropy, wordList: returnedWordList } = result;

      expect(typeof entropy).toBe("string");
      expect(entropy).toHaveLength(64);
      expect(returnedWordList).toBe(getWordList(wordListType));
    }
  });

  it("should use default word list when not specified", () => {
    const generateResult = generateMnemonic();
    assert(isOk(generateResult));

    const { mnemonic } = generateResult;
    const result = parseEntropy({ mnemonic });
    assert(isOk(result));

    const { entropy, wordList } = result;

    expect(typeof entropy).toBe("string");
    expect(wordList).toBe(getWordList(defaultWordList));
  });

  it("should return error for invalid mnemonic", () => {
    const result = parseEntropy({ mnemonic: "invalid mnemonic phrase" });
    expect(isErr(result)).toBe(true);
  });

  it("should return error for empty mnemonic", () => {
    const result = parseEntropy({ mnemonic: "" });
    expect(isErr(result)).toBe(true);
  });

  it("should return error for mnemonic with wrong word count", () => {
    const result = parseEntropy({ mnemonic: "abandon abandon abandon" });
    expect(isErr(result)).toBe(true);
  });

  it("should return error for mnemonic with invalid words", () => {
    const invalidMnemonic =
      "invalid word list test mnemonic phrase with wrong words here now check this entropy conversion failure case";
    const result = parseEntropy({ mnemonic: invalidMnemonic });
    expect(isErr(result)).toBe(true);
  });

  it("should work with custom word list array", () => {
    const customWordList = Array.from({ length: wordListLength }, (_, i) => `word${i}`);
    const generateResult = generateMnemonic({ wordList: customWordList });
    assert(isOk(generateResult));

    const { mnemonic, wordList } = generateResult;
    expect(wordList).toBe(customWordList);
    const result = parseEntropy({ mnemonic, wordList });
    assert(isOk(result));

    const { entropy, wordList: returnedWordList } = result;

    expect(typeof entropy).toBe("string");
    expect(returnedWordList).toBe(customWordList);
  });

  it("should return consistent entropy for same mnemonic", () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

    const result1 = parseEntropy({ mnemonic });
    const result2 = parseEntropy({ mnemonic });

    assert(isOk(result1));
    assert(isOk(result2));

    const { entropy: entropy1 } = result1;
    const { entropy: entropy2 } = result2;

    expect(entropy1).toBe(entropy2);
  });
});
