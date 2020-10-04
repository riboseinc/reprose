import type { Schema } from 'prosemirror-model';
import { setBlockType } from 'prosemirror-commands';
import { AuthoringFeature, blockActive } from '../../author';
import { NODE_TYPES } from './schema';

const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number]>> = {
  getKeymap(schema) {
    return {
      'Shift-Ctrl-0': setBlockType(schema.nodes.paragraph),
    };
  },

  getMenuOptions(schema) {
    return {
      blocks: {
        plain: {
          label: 'Change to paragraph',
          //content: icons.paragraph,
          active: blockActive(schema.nodes.paragraph),
          enable: setBlockType(schema.nodes.paragraph),
          run: setBlockType(schema.nodes.paragraph),
        },
      },
    };
  }
};

export default feature;
