import { mnemonicToEntropy, validateMnemonic } from "bip39";
import { parseError, type Result, unwrap } from "trynot";
import { type BuiltinWordList, defaultWordList, getWordList, type WordList } from "./wordlists";

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
