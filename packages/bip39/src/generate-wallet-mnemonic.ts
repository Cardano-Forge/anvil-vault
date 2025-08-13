import { generateMnemonic as generateMnemonicFn } from "bip39";
import { type Result, parseError, unwrap } from "trynot";
import { type BuiltinWordList, type WordList, defaultWordList, getWordList } from "./wordlists";

export type Mnemonic = string;

export type GenerateMnemonicInput = {
  wordCount?: 24 | 12;
  wordList?: BuiltinWordList | WordList;
};

export type GenerateMnemonicOutput = readonly [Mnemonic, WordList];

export function generateMnemonic(input?: GenerateMnemonicInput): Result<GenerateMnemonicOutput> {
  try {
    const wordList = unwrap(getWordList(input?.wordList ?? defaultWordList));
    const wordCount = input?.wordCount ?? 24;
    const entropy = wordCount === 24 ? 256 : 128;
    const mnemonic = generateMnemonicFn(entropy, undefined, wordList);
    if (!mnemonic) {
      return new Error("Failed to generate mnemonic");
    }
    return [mnemonic, wordList] as const;
  } catch (error) {
    return parseError(error);
  }
}
