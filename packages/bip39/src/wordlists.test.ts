import { assert, isErr } from "trynot";
import { describe, expect, it } from "vitest";
import {
  type BuiltinWordList,
  type WordList,
  builtinWordLists,
  getWordList,
  wordListLength,
} from "./wordlists";

describe("getWordList", () => {
  it("should return the same array when given a valid WordList array", () => {
    const origWordList: WordList = Array.from({ length: wordListLength }, (_, i) => `word${i}`);
    const customWordList: WordList = [...origWordList];
    const result = getWordList(customWordList);

    assert(!isErr(result));
    expect(result).toBe(customWordList);
    expect(result).toStrictEqual(origWordList);
  });

  it("should return wordlist for all builtin languages", () => {
    for (const language of builtinWordLists) {
      const result = getWordList(language);

      assert(!isErr(result), `Expected wordlist for language: ${language}`);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(wordListLength);
    }
  });

  it("should return error for invalid builtin language", () => {
    const result = getWordList("invalid" as BuiltinWordList);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.message).toContain("Unsupported language: invalid");
    }
  });

  it("should return error for WordList that is too short", () => {
    const shortWordList: WordList = ["word1", "word2", "word3"];
    const result = getWordList(shortWordList);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.message).toContain(`Word list is too short: 3 / ${wordListLength}`);
    }
  });

  it("should return error for empty custom WordList", () => {
    const emptyWordList: WordList = [];
    const result = getWordList(emptyWordList);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.message).toContain(`Word list is too short: 0 / ${wordListLength}`);
    }
  });
});
