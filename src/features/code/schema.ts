import { nodes, marks } from 'prosemirror-schema-basic';
import { FeatureOptions, SchemaFeature } from '../../schema';

export const INLINE_MARK = 'code' as const;
export const BLOCK_NODE = 'code_block' as const;

export default function getFeature(opts?: FeatureOptions) {

  const inlineMarkSpec = marks.code;
  const blockNodeSpec = nodes.code_block;

  if (opts?.allowBlocks === true) {
    const feature: SchemaFeature<typeof BLOCK_NODE, typeof INLINE_MARK> = {
      nodes: {
        code_block: blockNodeSpec,
      },
      marks: {
        code: inlineMarkSpec,
      },
    };
    return feature;
  } else {
    const feature: SchemaFeature<'', typeof INLINE_MARK> = {
      marks: {
        code: inlineMarkSpec,
      },
    };
    return feature;
  }
}
