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
      toDOM() {
        return [
          'div',
          { 'data-admonition-caption': '1', 'style': 'font-weight: bold;' },
          0,
        ];
      },
      parseDOM: [{
        tag: 'div[data-admonition-caption]',
      }, {
        tag: 'admonition-caption',
      }],
    },

    admonition: {
      attrs: { type: { default: ADMONITION_TYPES[0] } },
      content: 'admonition_caption? paragraph+',
      group: 'admonition block',
      toDOM(node) {
        return [
          'div',
          { 'data-admonition-type': node.attrs.type },
          ADMONITION_TYPE_LABELS[node.attrs.type as typeof ADMONITION_TYPES[number]],
          0,
        ];
      },
      parseDOM: [{
        tag: 'div[data-admonition-type]',
        getAttrs (domEl) {
          const el = domEl as HTMLElement;
          return {
            type:
              el.getAttribute('data-admonition-type') ||
              el.getAttribute('admonition-type') ||
              ADMONITION_TYPES[0],
          };
        },
      }],
    },

  },

};

export default feature;
