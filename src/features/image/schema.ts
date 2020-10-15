import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'image'
] as const;

const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

  nodes: {

    image: {
      group: 'figure_content',
      inline: false,
      atom: true,
      attrs: {
        alt: { default: '' },
        src: {},
      },
      parseDOM: [{
        tag: 'img[src]',
        getAttrs(domNode) {
          const el = domNode as HTMLImageElement;
          return {
            alt: el.getAttribute('alt'),
            src: el.getAttribute('src'),
          };
        },
      }],
      toDOM(node) {
        const { alt, src } = node.attrs;
        return ['img', {
          alt,
          src,
        }];
      },
    },
  },

};

export default feature;
