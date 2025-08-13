import { mnemonicToEntropy as mnemonicToEntropyFn, validateMnemonic } from "bip39";
import { type Result, parseError, unwrap } from "trynot";
import { type BuiltinWordList, type WordList, defaultWordList, getWordList } from "./wordlists";

export type Entropy = string;

export type MnemonicToEntropyInput = {
  mnemonic: string;
  wordList?: BuiltinWordList | WordList;
};

export type MnemonicToEntropyOutput = readonly [Entropy, WordList];

export function mnemonicToEntropy(input: MnemonicToEntropyInput): Result<MnemonicToEntropyOutput> {
  try {
    const wordList = unwrap(getWordList(input.wordList ?? defaultWordList));
    if (!validateMnemonic(input.mnemonic, wordList)) {
      return new Error("Invalid mnemonic phrase");
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
