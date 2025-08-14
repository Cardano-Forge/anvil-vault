import { mnemonicToEntropy, validateMnemonic } from "bip39";
import { type Result, parseError, unwrap } from "trynot";
import { type BuiltinWordList, type WordList, defaultWordList, getWordList } from "./wordlists";

export type Entropy = string;

export type ParseEntropyInput = {
  mnemonic: string;
  wordList?: BuiltinWordList | WordList;
};

export type ParseEntropyOutput = {
  entropy: Entropy;
  wordList: WordList;
};

export function parseEntropy(input: ParseEntropyInput): Result<ParseEntropyOutput> {
  try {
    const wordList = unwrap(getWordList(input.wordList ?? defaultWordList));
    if (!validateMnemonic(input.mnemonic, wordList)) {
      return new Error("Invalid mnemonic phrase");
    }
    const entropy = mnemonicToEntropy(input.mnemonic, wordList);
    if (!entropy) {
      return new Error("Failed to convert mnemonic to entropy");
    }
    return { entropy, wordList };
  } catch (error) {
    return parseError(error);
  }
}
