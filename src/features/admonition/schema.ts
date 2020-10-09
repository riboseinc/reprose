import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'admonition',
  'admonition_caption',
] as const;

export const ADMONITION_TYPES = [
  'seealso',
  'note',
  'tip',
  'important',
  'warning',
  'attention',
] as const;

export const ADMONITION_TYPE_LABELS: { [key in typeof ADMONITION_TYPES[number]]: string } = {
  'seealso': "See also:",
  'note': "Note:",
  'tip': "Tip:",
  'important': "Important!",
  'warning': "Warning!",
  'attention': "Attention!",
} as const;

const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

  nodes: {

    admonition_caption: {
      content: 'inline*',
      toDOM() { return ['admonition-caption', { 'style': 'font-weight: bold;' }, 0] },
      parseDOM: [{ tag: 'admonition-caption' }],
    },

    admonition: {
      attrs: { type: { default: ADMONITION_TYPES[0] } },
      content: 'admonition_caption? paragraph+',
      group: 'admonition block',
      toDOM(node) {
        return [
          'admonition',
          { 'admonition-type': node.attrs.type },
          ADMONITION_TYPE_LABELS[node.attrs.type as typeof ADMONITION_TYPES[number]],
          0,
        ];
      },
      parseDOM: [{
        tag: 'admonition',
        getAttrs (dom) {
          return {
            type: (<HTMLElement>dom).getAttribute('admonition-type') || ADMONITION_TYPES[0],
          };
        }
      }],
    },

  },

};

export default feature;
