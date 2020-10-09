import { Plugin } from 'prosemirror-state';
import type { Node, Schema } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { AuthoringFeature, blockActive, canInsert } from '../../author';
import { NODE_TYPES as PARAGRAPH_NODES } from '../paragraph/schema';
import { NODE_TYPES, ADMONITION_TYPES, ADMONITION_TYPE_LABELS } from './schema';
import { setBlockType } from 'prosemirror-commands';


class AdmonitionView<S extends Schema<any, any>> {
  node: Node<S>
  dom: HTMLDivElement
  contentDOM: HTMLDivElement
  selector: HTMLSelectElement

  constructor(node: Node<S>, view: EditorView<S>, getPos: boolean | (() => number)) {
    this.node = node;
    this.contentDOM = document.createElement('div');
    this.dom = document.createElement('div');

    this.selector = document.createElement('select');
    for (const type of ADMONITION_TYPES) {
      const opt = document.createElement('option');
      opt.setAttribute('value', type);
      if (type === node.attrs.type) {
        opt.setAttribute('selected', 'selected');
      }
      opt.innerText = ADMONITION_TYPE_LABELS[type];
      this.selector.appendChild(opt);
    }

    this.selector.setAttribute('value', node.attrs.type);

    this.selector.addEventListener('change', (evt) => {
      const newType = (<HTMLSelectElement>evt.currentTarget).value;
      if (typeof getPos === "function") {
        view.dispatch(view.state.tr.setNodeMarkup(getPos(), undefined, { type: newType }));
      } else {
        console.error("getPos is not a function");
      }
    });

    this.dom.appendChild(this.selector);
    this.dom.appendChild(this.contentDOM);
  }
}


// This feature depends on paragraphs feature being enabled too.
const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number] | typeof PARAGRAPH_NODES[number]>> = {

  getPlugins(schema) {
    return [
      new Plugin({
        props: {
          nodeViews: {
            admonition: (node, view, getPos) => {
              return new AdmonitionView(node, view, getPos);
            },
          },
        },
      }),
    ];
  },

  getMenuOptions(schema) {
    return {
      admonitions: {
        admonition: {
          label: 'Insert an admonition',
          active: blockActive(schema.nodes.admonition),
          enable: canInsert(schema.nodes.admonition),
          run: (state, dispatch) =>
            dispatch!(state.tr.replaceSelectionWith(schema.nodes.admonition.create(undefined, schema.nodes.paragraph.create()))),
        },
        admonition_caption: {
          label: 'Change to admonition caption',
          active: blockActive(schema.nodes.admonition_caption),
          enable: setBlockType(schema.nodes.admonition_caption),
          run: setBlockType(schema.nodes.admonition_caption),
        },
      },
    };
  },

};


export default feature;
