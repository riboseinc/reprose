import { marks } from 'prosemirror-schema-basic';
import { SchemaFeature } from '../../schema';

export const MARK_TYPES = [
  'link',
] as const;

const feature: SchemaFeature<'', typeof MARK_TYPES[number]> = {
  marks: {
    link: marks.link,
  },
};

export default feature;
