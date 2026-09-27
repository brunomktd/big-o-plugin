export type LoopBound = 'n' | 'log' | 'const';

export interface LoopNode {
  kind: 'loop';
  bound: LoopBound;
  label: string;
  line: number;
  body: IRNode[];
}

export interface CallNode {
  kind: 'call';
  name: string;
  receiver?: string;
  line: number;
  recursive: boolean;
  halved: boolean;
  /** `${branchId}:${arm}` segments; two calls sharing a branchId with different arms never both run. */
  branches: string[];
}

export type IRNode = LoopNode | CallNode;

export interface FunctionIR {
  name: string;
  line: number;
  character: number;
  body: IRNode[];
  memoized: boolean;
}
