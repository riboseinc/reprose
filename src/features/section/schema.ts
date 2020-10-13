import { SchemaFeature } from '../../schema';

export const DEFAULT_SECTION_ID = 'untitled-section';

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
      // Section IDs are used e.g. in anchors for ToC/in-page linking.
      attrs: { id: {} },
      content: 'section_header (block | sectioning)+',
      group: 'sectioning',
      toDOM(node) {
        return [
          'section',
          {
            id: node.attrs.id || DEFAULT_SECTION_ID,
          },
          0,
        ];
      },
      parseDOM: [{
        tag: 'section',
        getAttrs (domEl) {
          const el = domEl as HTMLDivElement;
          const header = el.querySelector('header');
          const existingID = el.getAttribute('id')?.trim() || DEFAULT_SECTION_ID;
          return {
            id: existingID !== DEFAULT_SECTION_ID
              ? existingID
              : makeSectionID(header?.textContent || DEFAULT_SECTION_ID),
          };
        },
      }, {
        tag: 'section input',
        ignore: true,
      }, {
        tag: 'div[data-section-editor]',
        skip: true,
      }],
    },

  },

};

export function makeSectionID(headerText: string): string {
  return headerText.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

export default feature;
