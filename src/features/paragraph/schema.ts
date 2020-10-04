import { nodes } from 'prosemirror-schema-basic';
import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'paragraph',
] as const;

const feature: SchemaFeature<typeof NODE_TYPES[number]> = {
  nodes: {
    paragraph: nodes.paragraph,
  },
};

export default feature;
