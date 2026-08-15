import { get } from "fast-levenshtein";
import { normalize } from "./textUtils";

export function calculateSimilarity(expected, actual) {
  expected = normalize(expected);
  actual = normalize(actual);

  if (!expected || !actual) {
    return 0;
  }

  const distance = get(expected, actual);

  const maxLength = Math.max(
    expected.length,
    actual.length
  );

  return Math.round(
    ((maxLength - distance) / maxLength) * 100
  );
}