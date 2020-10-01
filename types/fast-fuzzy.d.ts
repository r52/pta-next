/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'fast-fuzzy' {
  interface FuzzyOptions<T> {
    keySelector?: (obj: T) => string;
    threshold?: number;
    ignoreCase?: boolean;
    ignoreSymbols?: boolean;
    normalizeWhitespace?: boolean;
    returnMatchData?: boolean;
    useDamerau?: boolean;
    useSellers?: boolean;
  }

  interface FuzzyMatch<T> {
    name?: string;
    item?: T;
    original?: string;
    key?: string;
    score?: number;
    match?: {
      index: number;
      length: number;
    };
  }

  export function fuzzy(input: string): number;
  export function search<T>(
    input: string,
    set: T[],
    opts?: FuzzyOptions<T>
  ): FuzzyMatch<T>[];

  export class Searcher<T> {
    constructor(set: T[], opts?: FuzzyOptions<T>);
    add(set: T[]): void;
    search(input: string, opts?: FuzzyOptions<T>): FuzzyMatch<T>[];
  }
}
