import { SchemaFeature } from '../../schema';

export interface LinkNodeAttrs {
  schemaID: string
  reference: string
  title: string
  hRef: string
}

export const NODE_TYPES = [
  'link',
] as const;

export default function getFeature() {
  const feature: SchemaFeature<typeof NODE_TYPES[number]> = {
    nodes: {
      link: {
        group: 'inline',
        content: 'inline*',
        inline: true,
        atom: true,
        attrs: {
          schemaID: { default: 'web' },
          reference: {},
          hRef: { default: '' },
          title: { default: '' },
        },
        draggable: false,
        parseDOM: [{
          tag: 'a[href]',
          getAttrs(domNode) {
            const el = domNode as HTMLAnchorElement;
            return {
              schemaID: el.getAttribute('data-link-schema-id') || 'web',
              reference: el.getAttribute('data-link-reference') || el.getAttribute('href'),
              hRef: el.getAttribute('href'),
              title: el.getAttribute('title'),
            };
          },
        }],
        toDOM(node) {
          const { hRef, title, schemaID, reference } = node.attrs;
          const href: string = schemaID === 'web' ? reference : (hRef || 'javascript: void 0');
          return ['a', {
              href,
              title,
              'data-link-schema-id': schemaID,
              'data-link-reference': reference,
            }, 0];
        },
      },
    },
  };

  return feature;
};
