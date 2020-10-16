import { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'image'
] as const;

export interface FeatureOptions {
  getSrcToShow: (src: string) => string
  getSrcToStore: (src: string) => string
}

export default function getFeature(opts: FeatureOptions) {
  const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

    nodes: {

      image: {
        group: 'figure_content',
        inline: false,
        atom: true,
        attrs: {
          alt: { default: '' },
          src: { default: '' },
        },
        parseDOM: [{
          tag: 'img[src]',
          getAttrs(domNode) {
            const el = domNode as HTMLImageElement;
            const src = el.getAttribute('src') || '';
            return {
              alt: el.getAttribute('alt'),
              src: opts.getSrcToStore(src),
            };
          },
        }],
        toDOM(node) {
          const { alt, src } = node.attrs;
          return ['img', {
            alt,
            src: opts.getSrcToShow(src),
          }];
        },
      },
    },

  };

  return feature;
}
