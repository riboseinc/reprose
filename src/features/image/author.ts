import { Plugin } from 'prosemirror-state';
import type { Node, Schema } from 'prosemirror-model';
import type { NodeView, EditorView } from 'prosemirror-view';

import { AuthoringFeature, blockActive, canInsert } from '../../author';
import { NODE_TYPES } from './schema';


interface FeatureOptions {
  requestImageURL: () => Promise<string>
}


export default function getFeature(opts: FeatureOptions) {
  class ImageView<S extends Schema<any, any>> implements NodeView<S> {
    node: Node<S>
    dom: HTMLElement
    altInput: HTMLInputElement

    constructor(node: Node<S>, view: EditorView<S>, getPos: boolean | (() => number)) {
      this.node = node;

      this.dom = document.createElement('img');
      this.dom.setAttribute('alt', node.attrs.alt);
      this.dom.setAttribute('src', node.attrs.src);

      this.altInput = document.createElement('input');
      this.altInput.setAttribute('type', 'text');
      this.altInput.setAttribute(
        'placeholder',
        "Please enter alternative text for visually impaired readers here");
      this.altInput.style.width = '100%';
      this.altInput.addEventListener('change', (evt) => {
        const alt = (<HTMLInputElement>evt.currentTarget).value;

        this.altInput.value = alt;

        if (typeof getPos === "function") {
          view.dispatch(view.state.tr.setNodeMarkup(getPos(), undefined, {
            alt,
          }));
        } else {
          console.error("getPos is not a function");
        }
      });

      this.dom.appendChild(this.altInput);
    }

    stopEvent(event: any) {
      return (this.altInput === event.target);
    }

    ignoreMutation() {
      return true;
    }
  }


  // This feature depends on paragraphs feature being enabled too.
  const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number]>> = {

    getPlugins(schema) {
      return [
        new Plugin({
          props: {
            nodeViews: {
              image: (node, view, getPos) => {
                return new ImageView(node, view, getPos);
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
            label: "Insert image",
            active: blockActive(schema.nodes.image),
            enable: canInsert(schema.nodes.image),
            run: async (state, dispatch) => {
              const imageURL = await opts.requestImageURL();
              return dispatch!(
                state.tr.replaceSelectionWith(
                  schema.nodes.image.create({ src: imageURL })));
            },
          },
        },
      };
    },

  };

  return feature;
}
