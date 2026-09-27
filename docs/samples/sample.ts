// Each function is preceded by `// @bigO <expected>`; server/test/samples.test.ts checks them.

// @bigO O(1)
export function first(items: number[]): number {
  return items[0] + Math.max(1, 2);
}

// @bigO O(n)
export function sum(items: number[]): number {
  let total = 0;
  for (let i = 0; i < items.length; i++) total += items[i];
  return total;
}

// @bigO O(1)
function fixedLoop(): number {
  let x = 0;
  for (let i = 0; i < 10; i++) x += i;
  return x;
}

// @bigO O(n²)
function hasDuplicate(items: number[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i] === items[j]) return true;
    }
  }
  return false;
}

// @bigO O(n)
function hasDuplicateFast(items: number[]): boolean {
  const seenSet = new Set<number>();
  for (const item of items) {
    if (seenSet.has(item)) return true;
    seenSet.add(item);
  }
  return false;
}

// @bigO O(n²)
const uniqueSlow = (items: string[]) => items.filter((x, i) => items.indexOf(x) === i);

// @bigO O(n log n)
function sortedCopy(items: number[]): number[] {
  return [...items].sort((a, b) => a - b);
}

// @bigO O(log n)
function binarySearch(items: number[], target: number): number {
  let lo = 0;
  let hi = items.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (items[mid] === target) return mid;
    if (items[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// @bigO O(2ⁿ)
function fib(n: number): number {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}

// @bigO O(n)
function fibMemo(n: number, memo = new Map<number, number>()): number {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n)!;
  const v = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, v);
  return v;
}

// @bigO O(n log n)
function mergeSort(items: number[]): number[] {
  if (items.length <= 1) return items;
  const mid = items.length >> 1;
  const left = mergeSort(items.slice(0, mid));
  const right = mergeSort(items.slice(mid));
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) out.push(left[i] < right[j] ? left[i++] : right[j++]);
  return out.concat(left.slice(i), right.slice(j));
}

// @bigO O(n log n)
function quickSort(items: number[], low: number, high: number): void {
  if (low >= high) return;
  const pivotIndex = partition(items, low, high);
  quickSort(items, low, pivotIndex - 1);
  quickSort(items, pivotIndex + 1, high);
}

// @bigO O(n)
function partition(items: number[], low: number, high: number): number {
  let i = low;
  for (let j = low; j < high; j++) {
    if (items[j] < items[high]) [items[i], items[j]] = [items[j], items[i++]];
  }
  [items[i], items[high]] = [items[high], items[i]];
  return i;
}

// @bigO O(log n)
function searchRecursive(items: number[], x: number, lo: number, hi: number): number {
  if (lo > hi) return -1;
  const mid = (lo + hi) >> 1;
  if (items[mid] === x) return mid;
  if (items[mid] < x) return searchRecursive(items, x, mid + 1, hi);
  return searchRecursive(items, x, lo, mid - 1);
}

// @bigO O(n³)
function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const c = a.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) c[i][j] += a[i][k] * b[k][j];
  return c;
}

// @bigO O(n!)
function permutations(items: number[], prefix: number[] = [], out: number[][] = []): number[][] {
  if (!items.length) out.push(prefix);
  for (let i = 0; i < items.length; i++) {
    permutations([...items.slice(0, i), ...items.slice(i + 1)], [...prefix, items[i]], out);
  }
  return out;
}

export class Repo {
  // @bigO O(n²)
  findAll(ids: string[], rows: { id: string }[]) {
    return ids.map((id) => rows.find((r) => r.id === id));
  }
}
