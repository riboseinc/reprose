import { Plugin } from 'prosemirror-state';
import type { Node, Schema } from 'prosemirror-model';
import type { NodeView, EditorView } from 'prosemirror-view';

import { type AuthoringFeature, blockActive, canInsert } from '../../author';
import { NODE_TYPES as FIGURE_NODES } from '../figure/schema';
import {
  type FeatureOptions as SchemaFeatureOptions,
  NODE_TYPES,
} from './schema';


interface FeatureOptions extends SchemaFeatureOptions {
  requestImageURL: (evt: MouseEvent) => Promise<string | undefined>
}


export default function getFeature(opts: FeatureOptions) {
  class ImageView<S extends Schema<typeof NODE_TYPES[number]>> implements NodeView<S> {
    node: Node<S>
    dom: HTMLElement
    img: HTMLImageElement
    altInput: HTMLInputElement

    constructor(node: Node<S>, view: EditorView<S>, getPos: boolean | (() => number)) {
      this.node = node;

      this.dom = document.createElement('div');
      this.dom.setAttribute('data-image-editor', '1');

      this.img = document.createElement('img');
      this.img.setAttribute('alt', node.attrs.alt);

      const src = node.attrs.src.startsWith('file:') ? node.attrs.src : opts.getSrcToShow(node.attrs.src);
      this.img.setAttribute('src', src);

      this.altInput = document.createElement('input');
      this.altInput.setAttribute('type', 'text');
      this.altInput.value = node.attrs.alt;
      this.altInput.setAttribute(
        'placeholder',
        "Please enter alternative text for visually impaired readers here");
      this.altInput.addEventListener('change', (evt) => {
        const alt = (<HTMLInputElement>evt.currentTarget).value;

        this.altInput.value = alt;

        if (typeof getPos === "function") {
          view.dispatch(view.state.tr.setNodeMarkup(getPos(), undefined, {
            alt,
            src: node.attrs.src,
          }));
        } else {
          console.error("getPos is not a function");
        }
      });

      this.dom.appendChild(this.altInput);
      this.dom.appendChild(this.img);
    }

    stopEvent(event: any) {
      return (this.altInput === event.target);
    }

    ignoreMutation() {
      return true;
    }
  }


  // This feature depends on paragraphs feature being enabled too.
  const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number] | typeof FIGURE_NODES[number]>> = {

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
        figures: {
          image: {
            label: "Insert image",
            active: blockActive(schema.nodes.image),
            enable: canInsert(schema.nodes.figure),
            run: async (state, dispatch, evt) => {
              const imageURL = await opts.requestImageURL(evt);
              if (imageURL !== undefined) {
                dispatch!(
                  state.tr.replaceSelectionWith(
                    schema.nodes.figure.create(undefined, [
                      schema.nodes.image.create({ src: imageURL }),
                      schema.nodes.figure_caption.create(undefined, schema.text("Figure caption goes here…")),
                  ])
                ));
              }
            },
          },
        },
      };
    },

  };

  return feature;
}
