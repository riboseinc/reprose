import type { Schema } from 'prosemirror-model';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { AuthoringFeature, blockActive } from '../../author';
import { NODE_TYPES } from './schema';


const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number]>> = {

  getKeymap(schema) {
    return {
      'Shift-Ctrl-8': wrapInList(schema.nodes.bullet_list),
      'Shift-Ctrl-9': wrapInList(schema.nodes.ordered_list),
      'Enter': splitListItem(schema.nodes.list_item),
      'Mod-[': liftListItem(schema.nodes.list_item),
      'Mod-]': sinkListItem(schema.nodes.list_item),
    };
  },

  getMenuOptions(schema) {
    return {
      blocks: {
        bullet_list: {
          label: 'Wrap in bullet list',
          active: blockActive(schema.nodes.bullet_list),
          enable: wrapInList(schema.nodes.bullet_list),
          run: wrapInList(schema.nodes.bullet_list),
        },
        ordered_list: {
          label: 'Wrap in ordered list',
          active: blockActive(schema.nodes.ordered_list),
          enable: wrapInList(schema.nodes.ordered_list),
          run: wrapInList(schema.nodes.ordered_list),
        },
      },
    };
  },

};


export default feature;
