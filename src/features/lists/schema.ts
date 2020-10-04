import { orderedList, bulletList, listItem } from 'prosemirror-schema-list';
import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'ordered_list',
  'bullet_list',
  'list_item',
] as const;

const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

  nodes: {

    ordered_list: {
      ...orderedList,
      content: 'list_item+',
      group: 'block',
    },

    bullet_list: {
      ...bulletList,
      content: 'list_item+',
      group: 'block',
    },

    list_item: {
      ...listItem,
      content: 'paragraph block*',
    },

  },

};

export default feature;
