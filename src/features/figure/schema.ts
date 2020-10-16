import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'figure',
  'figure_caption',
] as const;


const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

  nodes: {

    figure_caption: {
      content: 'inline*',
      toDOM() {
        return [
          'figcaption',
          0,
        ];
      },
      parseDOM: [{
        tag: 'figcaption',
      }],
    },

    figure: {
      // Section IDs are used e.g. in anchors for ToC/in-page linking.
      content: 'figure_content figure_caption?',
      group: 'block',
      toDOM(node) {
        return [
          'figure',
          0,
        ];
      },
      parseDOM: [{
        tag: 'figure',
      }],
    },

  },

};

export default feature;
