import { wordlists as wordLists } from "bip39";
import type { Result } from "trynot";

export type WordList = string[];

export const builtinWordLists = [
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
] as const;

export type BuiltinWordList = (typeof builtinWordLists)[number];

export const defaultWordList = "english" satisfies BuiltinWordList;

export const wordListLength = wordLists.english.length; // 2048

export function getWordList(language: BuiltinWordList | WordList): Result<WordList> {
  const isArray = Array.isArray(language);
  if (isArray && language.length < wordListLength) {
    return new Error(`Word list is too short: ${language.length} / ${wordListLength}`);
  }
  if (isArray) {
    return language;
  }
  const wordList = wordLists[language];
  if (!wordList) {
    return new Error(`Unsupported language: ${language}`);
  }
  return wordList;
}
