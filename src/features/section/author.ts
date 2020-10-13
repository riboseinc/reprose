import { Plugin } from 'prosemirror-state';
import type { Node, Schema } from 'prosemirror-model';
import type { NodeView, EditorView } from 'prosemirror-view';

import { AuthoringFeature, blockActive, canInsert } from '../../author';
import { NODE_TYPES as PARAGRAPH_NODES } from '../paragraph/schema';
import { DEFAULT_SECTION_ID, makeSectionID, NODE_TYPES } from './schema';
import { setBlockType } from 'prosemirror-commands';


class SectionView<S extends Schema<any, any>> implements NodeView<S> {
  node: Node<S>
  dom: HTMLElement
  contentDOM: HTMLElement
  idInput: HTMLInputElement

  constructor(node: Node<S>, private view: EditorView<S>, private getPos: boolean | (() => number)) {
    this.node = node;

    this.contentDOM = document.createElement('section');
    this.contentDOM.setAttribute('id', node.attrs.id);

    this.dom = document.createElement('div');
    this.dom.setAttribute('data-section-editor', '1');

    this.idInput = document.createElement('input');
    this.idInput.setAttribute('type', 'text');
    this.idInput.setAttribute('placeholder', 'Please provide reliable section ID for navigation');
    this.idInput.value = node.attrs.id === DEFAULT_SECTION_ID ? '' : node.attrs.id;
    this.idInput.style.width = '100%';
    this.idInput.addEventListener('change', (evt) => {
      const newID = (<HTMLInputElement>evt.currentTarget).value;
      const effectiveID = this.guessID(newID);
      this.idInput.value = effectiveID;
      if (typeof this.getPos === "function") {
        this.view.dispatch(this.view.state.tr.setNodeMarkup(this.getPos(), undefined, {
          id: effectiveID,
        }));
      } else {
        console.error("getPos is not a function");
      }
    });

    this.dom.appendChild(this.idInput);
    this.dom.appendChild(this.contentDOM);
  }

  updateID(newID: string) {
    this.contentDOM.setAttribute('id', newID);
  }

  guessID(newID: string, node?: Node<S>): string {
    const n = node || this.node;
    const id = newID.trim() !== DEFAULT_SECTION_ID
      ? newID
      : n.firstChild?.textContent || DEFAULT_SECTION_ID;
    return makeSectionID(id);
  }

  stopEvent(event: any) {
    if (this.idInput === event.target) {
      return true;
    }
    return false;
  }

  ignoreMutation() {
    return true;
  }
}


// This feature depends on paragraphs feature being enabled too.
const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number] | typeof PARAGRAPH_NODES[number]>> = {

  getPlugins(schema) {
    return [
      new Plugin({
        props: {
          nodeViews: {
            section: (node, view, getPos) => {
              return new SectionView(node, view, getPos);
            },
          },
        },
      }),
    ];
  },

  getMenuOptions(schema) {
    return {
      sections: {
        section: {
          label: 'Insert subsection',
          active: blockActive(schema.nodes.section),
          enable: canInsert(schema.nodes.section),
          run: (state, dispatch) =>
            dispatch!(
              state.tr.replaceSelectionWith(
                schema.nodes.section.create({ id: DEFAULT_SECTION_ID }, [
                  schema.nodes.section_header.create(undefined, schema.text("Untitled section")),
                  schema.nodes.paragraph.create(),
                ]))),
        },
        section_header: {
          label: 'Make section header',
          active: blockActive(schema.nodes.section_header),
          enable: setBlockType(schema.nodes.section_header),
          run: setBlockType(schema.nodes.section_header),
        },
      },
    };
  },

};


export default feature;
