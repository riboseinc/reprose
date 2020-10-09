import { marks } from 'prosemirror-schema-basic';
import { SchemaFeature } from '../../schema';

export const MARK_TYPES = [
  'em',
] as const;

const feature: SchemaFeature<'', typeof MARK_TYPES[number]> = {
  marks: {
    em: marks.em,
  },
};

export default feature;

