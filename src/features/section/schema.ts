import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'section',
  'section_header',
] as const;

const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

  nodes: {

    section_header: {
      content: 'inline*',
      toDOM() {
        return [
          'header',
          { 'data-section-header': '1' },
          0,
        ];
      },
      parseDOM: [{
        tag: 'header[data-section-header]',
      }],
    },

    section: {
      //attrs: { type: { default: ADMONITION_TYPES[0] } },
      content: 'section_header block* section*',
      group: 'section',
      toDOM(node) {
        return [
          'section',
          0,
        ];
      },
      parseDOM: [{
        tag: 'section',
        getAttrs (domEl) {
          return {};
        },
      }],
    },

  },

};

export default feature;
