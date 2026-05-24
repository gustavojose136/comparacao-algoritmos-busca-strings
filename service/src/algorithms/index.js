import { BoyerMooreSearch } from "./BoyerMooreSearch.js";
import { KMPSearch } from "./KMPSearch.js";
import { NaiveSearch } from "./NaiveSearch.js";
import { RabinKarpSearch } from "./RabinKarpSearch.js";

export const algorithmFactories = {
  naive: () => new NaiveSearch(),
  "rabin-karp": () => new RabinKarpSearch(),
  kmp: () => new KMPSearch(),
  "boyer-moore": () => new BoyerMooreSearch()
};

export const algorithmKeys = Object.keys(algorithmFactories);

export function createStrategy(key) {
  const factory = algorithmFactories[key];
  if (!factory) {
    throw new Error(`Algoritmo desconhecido: ${key}`);
  }
  return factory();
}
