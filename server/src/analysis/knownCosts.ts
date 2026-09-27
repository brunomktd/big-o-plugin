import { Complexity, O1, OLOG, ON, ONLOGN } from './complexity';

/** Methods that run their function argument once per element (JS arrays, Java streams, Kotlin collections). */
export const ITERATION_METHODS = new Set([
  'forEach', 'forEachIndexed', 'map', 'mapIndexed', 'mapNotNull', 'flatMap', 'filter', 'filterNot',
  'filterIndexed', 'reduce', 'reduceRight', 'fold', 'some', 'every', 'find', 'findLast', 'findIndex',
  'findLastIndex', 'any', 'all', 'none', 'first', 'firstOrNull', 'last', 'lastOrNull', 'count', 'sumOf',
  'maxOf', 'minOf', 'maxBy', 'minBy', 'maxByOrNull', 'minByOrNull', 'groupBy', 'associate', 'associateBy',
  'associateWith', 'partition', 'takeWhile', 'dropWhile', 'anyMatch', 'allMatch', 'noneMatch', 'peek',
  'distinctBy', 'indexOfFirst', 'indexOfLast', 'onEach', 'zip', 'windowed', 'chunked',
]);

const SORT_METHODS = new Set([
  'sort', 'sorted', 'sortBy', 'sortedBy', 'sortWith', 'sortedWith', 'sortDescending', 'sortedDescending',
  'sortByDescending', 'sortedByDescending', 'toSorted', 'parallelSort',
]);

const LINEAR_METHODS = new Set([
  'indexOf', 'lastIndexOf', 'includes', 'contains', 'containsAll', 'containsValue', 'remove', 'removeAll',
  'retainAll', 'removeIf', 'splice', 'slice', 'concat', 'reverse', 'reversed', 'toReversed', 'join',
  'joinToString', 'shift', 'unshift', 'fill', 'copyOf', 'copyOfRange', 'arraycopy', 'toList', 'toMutableList',
  'toSet', 'toMutableSet', 'toArray', 'toTypedArray', 'distinct', 'sum', 'average', 'max', 'min',
  'maxOrNull', 'minOrNull', 'collect', 'keys', 'values', 'entries', 'from', 'flat', 'flatten', 'addAll',
  'putAll', 'clone', 'split', 'repeat', 'replace', 'replaceAll', 'substring', 'toCharArray', 'asList',
  'indices', 'frequency',
]);

const HEAP_METHODS = new Set(['add', 'offer', 'poll', 'push', 'pop', 'remove']);

const HASHED_RECEIVER = /(set|map|dict|hash|cache|memo|seen|visited|lookup|index)\w*$/i;
const HEAP_RECEIVER = /(heap|pq|priority)\w*$/i;
const SCALAR_RECEIVER = /^(Math|StrictMath|Integer|Long|Double|Float|Short|Byte|Character|Number)$/;

export interface KnownCost {
  cost: Complexity;
  reason: string;
}

export function callCost(name: string, receiver: string | undefined): KnownCost | undefined {
  if (!receiver || SCALAR_RECEIVER.test(receiver)) return undefined;
  if (name === 'binarySearch') return { cost: OLOG, reason: 'busca binária' };
  if (SORT_METHODS.has(name)) return { cost: ONLOGN, reason: 'ordenação' };
  if (HEAP_RECEIVER.test(receiver) && HEAP_METHODS.has(name)) return { cost: OLOG, reason: 'operação em heap' };
  if (LINEAR_METHODS.has(name)) {
    if (HASHED_RECEIVER.test(receiver) && ['contains', 'includes', 'remove'].includes(name)) return { cost: O1, reason: 'lookup em hash' };
    return { cost: ON, reason: 'percorre a coleção' };
  }
  return undefined;
}
