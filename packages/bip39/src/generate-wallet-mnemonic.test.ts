import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { type GenerateMnemonicInput, generateMnemonic } from "./generate-wallet-mnemonic";
import { defaultWordList, getWordList, wordListLength } from "./wordlists";

describe("generateMnemonic", () => {
  it("should generate a 24-word mnemonic by default", () => {
    const result = generateMnemonic();
    assert(!isErr(result));

    const [mnemonic, wordList] = result;
    const words = mnemonic.split(" ");

    expect(words).toHaveLength(24);
    expect(wordList).toBe(getWordList(defaultWordList));
  });

  it("should generate a 12-word mnemonic when specified", () => {
    const result = generateMnemonic({ wordCount: 12 });
    assert(!isErr(result));

    const [mnemonic] = result;
    const words = mnemonic.split(" ");

    expect(words).toHaveLength(12);
  });

  it("should generate a 24-word mnemonic when specified", () => {
    const result = generateMnemonic({ wordCount: 24 });
    assert(!isErr(result));

    const [mnemonic] = result;
    const words = mnemonic.split(" ");

    expect(words).toHaveLength(24);
  });

  it("should use different word lists", () => {
    const inputs = [
      { wordList: "english" },
      { wordList: "japanese" },
      { wordList: "chinese_simplified" },
      { wordList: "chinese_traditional" },
      { wordList: "french" },
      { wordList: "italian" },
      { wordList: "korean" },
      { wordList: "spanish" },
    ] satisfies GenerateMnemonicInput[];

    for (const input of inputs) {
      const result = generateMnemonic(input);
      assert(!isErr(result));

      const [mnemonic, wordList] = result;
      // Japanese uses ideographic spaces (U+3000), other languages use regular spaces
      const words = mnemonic.split(/[\s\u3000]+/).filter((word) => word.length > 0);

      expect(words).toHaveLength(24);
      expect(wordList).toBe(getWordList(input.wordList));
    }
  });

  it("should use custom word list array", () => {
    const customWordList = Array.from({ length: wordListLength }, (_, i) => `word${i}`);
    const result = generateMnemonic({ wordList: customWordList });
    assert(isOk(result));
    const [mnemonic, wordList] = result;
    const words = mnemonic.split(" ").filter((word) => word.length > 0);
    expect(words).toHaveLength(24);
    expect(wordList).toBe(customWordList);
  });

  it("should generate different mnemonics on each call", () => {
    const result1 = generateMnemonic();
    const result2 = generateMnemonic();

    assert(!isErr(result1));
    assert(!isErr(result2));

    const [mnemonic1] = result1;
    const [mnemonic2] = result2;

    expect(mnemonic1).not.toBe(mnemonic2);
    expect(mnemonic1).not.toEqual(mnemonic2);
  });

  it("should return both mnemonic and word list", () => {
    const result = generateMnemonic({ wordList: "french" });
    assert(!isErr(result));

    const [mnemonic, wordList] = result;

    expect(typeof mnemonic).toBe("string");
    expect(Array.isArray(wordList)).toBe(true);
    expect(wordList).toBe(getWordList("french"));
  });

  it("should handle empty input object", () => {
    const result = generateMnemonic({});
    assert(!isErr(result));

    const [mnemonic, wordList] = result;
    const words = mnemonic.split(" ");

    expect(words).toHaveLength(24);
    expect(wordList).toBe(getWordList(defaultWordList));
  });

  it("should validate generated mnemonic words are from the word list", () => {
    const result = generateMnemonic({ wordList: "english" });
    assert(!isErr(result));

    const [mnemonic, wordList] = result;
    const words = mnemonic.split(" ");

    for (const word of words) {
      expect(wordList.includes(word)).toBe(true);
    }
  });
});
