import { mnemonicToEntropy as mnemonicToEntropyFn } from "bip39";
import { type Result, parseError } from "trynot";
import { type BuiltinWordList, type WordList, defaultWordList, getWordList } from "./wordlists";

export type Entropy = string;

export type MnemonicToEntropyInput = {
  mnemonic: string;
  wordList?: BuiltinWordList | WordList;
};

export type MnemonicToEntropyOutput = readonly [Entropy, WordList];

export function mnemonicToEntropy(input: MnemonicToEntropyInput): Result<MnemonicToEntropyOutput> {
  try {
    const wordList = getWordList(input.wordList ?? defaultWordList);
    if (!wordList) {
      return new Error(`Unsupported language: ${wordList}`);
    }
    const entropy = mnemonicToEntropyFn(input.mnemonic, wordList);
    if (!entropy) {
      return new Error("Failed to convert mnemonic to entropy");
    }
    return [entropy, wordList] as const;
  } catch (error) {
    return parseError(error);
  }
}
