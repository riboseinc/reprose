//import { marks } from 'prosemirror-schema-basic';
import { SchemaFeature } from '../../schema';

//export const MARK_TYPES = [
//  'link',
//] as const;

export const NODE_TYPES = [
  'link',
] as const;

export default function getFeature() {
  // const schemas = opts?.schemas || DEFAULT_SCHEMAS;

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
        },
        draggable: true,
        parseDOM: [{
          tag: 'a[href]',
          getAttrs(domNode) {
            const el = domNode as HTMLAnchorElement;
            return {
              schemaID: el.getAttribute('data-link-schema-id') || 'web',
              reference: el.getAttribute('data-link-reference') || el.getAttribute('href'),
            };
          },
        }],
        toDOM(node) {
          const { schemaID, reference } = node.attrs;
          const href: string = schemaID === 'web' ? reference : 'javascript: void 0';
          return ['a', {
              href,
              'data-link-schema-id': schemaID,
              'data-link-reference': reference,
            }, 0];
        },
      },
    },
  };

  return feature;
};
