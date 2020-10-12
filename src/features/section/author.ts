import type { Schema } from 'prosemirror-model';
import { AuthoringFeature, blockActive, canInsert } from '../../author';
import { NODE_TYPES as PARAGRAPH_NODES } from '../paragraph/schema';
import { NODE_TYPES } from './schema';
import { setBlockType } from 'prosemirror-commands';


// This feature depends on paragraphs feature being enabled too.
const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number] | typeof PARAGRAPH_NODES[number]>> = {

  getMenuOptions(schema) {
    return {
      sections: {
        section: {
          label: 'Insert subsection',
          active: blockActive(schema.nodes.section),
          enable: canInsert(schema.nodes.section),
          run: (state, dispatch) =>
            dispatch!(
              state.tr.replaceSelectionWith(
                schema.nodes.section.create(undefined, [
                  schema.nodes.section_header.create(),
                ]))),
        },
        section_header: {
          label: 'Make section header',
          active: blockActive(schema.nodes.section_header),
          enable: setBlockType(schema.nodes.section_header),
          run: setBlockType(schema.nodes.section_header),
        },
      },
    };
  },

};


export default feature;
