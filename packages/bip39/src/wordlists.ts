import { wordlists as wordLists } from "bip39";

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

export function getWordList(language: BuiltinWordList | WordList): WordList | undefined {
  if (Array.isArray(language)) {
    return language;
  }
  return wordLists[language];
}
