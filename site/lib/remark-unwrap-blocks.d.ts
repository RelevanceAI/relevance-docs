import type { Root } from 'mdast';
import type { Transformer } from 'unified';

export function remarkUnwrapBlocks(): Transformer<Root, Root>;
