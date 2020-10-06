import { setBlockType, toggleMark } from 'prosemirror-commands';
import type { Schema } from 'prosemirror-model';
import { AuthoringFeature, blockActive, markActive } from '../../author';
import { FeatureOptions } from '../../schema';
import { INLINE_MARK, BLOCK_NODE } from './schema';

export default function getFeature(opts?: FeatureOptions) {

  function getInlineKeymap(schema: Schema<any, any>) {
    return {
      'Mod-`': toggleMark(schema.marks.code),
    };
  }

  function getInlineMenu(schema: Schema<any, any>) {
    return {
      code: {
        label: 'Toggle code',
        active: markActive(schema.marks.code),
        run: toggleMark(schema.marks.code)
      },
    };
  }

  if (opts?.allowBlocks === true) {
    const feature: AuthoringFeature<Schema<typeof BLOCK_NODE, typeof INLINE_MARK>> = {
      getKeymap(schema) {
        return {
          ...getInlineKeymap(schema),
          'Shift-Ctrl-\\': setBlockType(schema.nodes.code_block),
        };
      },
      getMenuOptions(schema) {
        return {
          inline: {
            ...getInlineMenu(schema),
          },
          blocks: {
            code_block: {
              label: 'Change to code block',
              active: blockActive(schema.nodes.code_block),
              enable: setBlockType(schema.nodes.code_block),
              run: setBlockType(schema.nodes.code_block)
            },
          },
        };
      },
    };
    return feature;

  } else {
    const feature: AuthoringFeature<Schema<'', typeof INLINE_MARK>> = {
      getKeymap(schema) {
        return {
          ...getInlineKeymap(schema),
        };
      },
      getMenuOptions(schema) {
        return {
          inline: {
            ...getInlineMenu(schema),
          },
        };
      },
    };
    return feature;
  }
}
