import '@babel/polyfill';
// Complains about regeneratorRuntime without ^^

import { Step, StepMap } from 'prosemirror-transform';
import { insertPoint } from 'prosemirror-transform';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { Fragment, Node, Schema } from 'prosemirror-model';
import { NodeView, EditorView } from 'prosemirror-view';
import { AuthoringFeature, blockActive } from '../../author';
import { NODE_TYPES } from './schema';


export interface LinkSchema {
  entityTypeLabel: string
  validateLocation: (location: string) => Promise<string[]>
  sanitizeLocation: (location: string) => Promise<string>
  //resolveURL
}


export type LinkSchemas = { [schemaID: string]: LinkSchema }


export const DEFAULT_SCHEMAS: LinkSchemas = {
  web: {
    entityTypeLabel: 'Web page',
    validateLocation: async (loc) => {
      if (!loc.toLowerCase().startsWith('https')) {
        return ["Link is not using secure protocol"];
      }
      return [];
    },
    sanitizeLocation: async (loc) => {
      if (loc.startsWith('http')) {
        return loc.toLowerCase().trim();
      } else {
        throw new Error("Invalid page URL");
      }
    },
  },
};


export default function getFeature(opts?: { schemas?: LinkSchemas }) {

  //TODO: const schemas = opts?.schemas || DEFAULT_SCHEMAS;

  type LinkInnerSchema = Schema<'text'>;

  class LinkView<S extends Schema<any, any>> implements NodeView<S> {
    // The implementation is based on the canonical ProseMirror’s footnote example

    node: Node<S>
    dom: HTMLSpanElement
    outerView: EditorView<S>
    innerView: EditorView<Schema<'text'>> | null

    constructor(node: Node<S>, view: EditorView<S>, private getPos: boolean | (() => number)) {
      this.node = node;
      this.outerView = view;
      this.getPos = getPos;
      this.dom = document.createElement('a');
      this.dom.textContent = node.textContent;
      this.innerView = null;
    }

    selectNode() {
      this.dom.classList.add('ProseMirror-selectednode');
      if (this.innerView === null) {
        this.open();
      }
    }

    deselectNode() {
      this.dom.classList.remove('ProseMirror-selectednode');
      this.close();
    }

    open() {
      // Append a floater to the outer node
      const tooltip = this.dom.appendChild(document.createElement('div'));
      tooltip.className = 'link-editor';

      if (typeof this.getPos === "function") {
        // Position link editor right on top of link.
        const { left, top } = this.outerView.coordsAtPos(this.getPos());
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      }

      // And put a sub-ProseMirror into that
      this.innerView = new EditorView<LinkInnerSchema>(tooltip, {
        // You can use any node as an editor document
        state: EditorState.create({
          //schema: new Schema({
          //  nodes: {
          //    text: { group: 'inline*' },
          //  },
          //}),
          doc: this.node,
          //plugins: [keymap({
          //  "Mod-z": () => undo(this.outerView.state, this.outerView.dispatch),
          //  "Mod-y": () => redo(this.outerView.state, this.outerView.dispatch)
          //})]
        }),
        dispatchTransaction: this.dispatchInner.bind(this),
        handleDOMEvents: {
          mousedown: () => {
            // Kludge to prevent issues due to the fact that the whole
            // link is node-selected (and thus DOM-selected) when
            // the parent editor is focused.
            if (this.innerView !== null && this.outerView.hasFocus()) {
              this.innerView.focus();
            }
            return false;
          },
        },
      });
    }

    close() {
      if (this.innerView !== null) {
        this.innerView.destroy();
        this.innerView = null;
      }
      this.dom.textContent = this.node.textContent;
    }

    dispatchInner(tr: Transaction) {
      if (this.innerView === null || typeof this.getPos !== "function") { return; }

      const { state, transactions } = this.innerView.state.applyTransaction(tr);

      this.innerView.updateState(state);

      if (!tr.getMeta('fromOutside')) {
        const outerTr = this.outerView.state.tr;
        const offsetMap = StepMap.offset(this.getPos() + 1);

        for (const transaction of transactions) {
          const steps = transaction.steps;
          for (const step of steps) {
            const mapped = step.map(offsetMap);
            if (mapped) {
              outerTr.step(mapped as Step<S>);
            }
          }
        }

        if (outerTr.docChanged) {
          this.outerView.dispatch(outerTr);
        }
      }
    }

    update(node: Node<S>) {
      if (!node.sameMarkup(this.node)) {
        return false;
      }

      this.node = node;

      if (this.innerView !== null) {
        const state = this.innerView.state;
        const start = node.content.findDiffStart(state.doc.content as Fragment<S>);
        if (start != null) {
          const diffEnd = node.content.findDiffEnd(
            // Possibly wrong typing?
            state.doc.content as unknown as Node<S>);

          if (diffEnd !== null && diffEnd !== undefined) {
            let { a: endA, b: endB } = diffEnd;
            const overlap = start - Math.min(endA, endB);

            if (overlap > 0) {
              endA += overlap;
              endB += overlap;
            }

            this.innerView.dispatch(
              state.tr.
              replace(start, endB, node.slice(start, endA)).
              setMeta('fromOutside', true));
          }
        }
      }
      return true
    }
    destroy() {
      this.close();
    }

    stopEvent(event: any) {
      if (this.innerView !== null && this.innerView.dom.contains(event.target)) {
        return true;
      }
      return false;
    }

    ignoreMutation() {
      return true;
    }
  }


  // This feature depends on paragraphs feature being enabled too.
  const feature: AuthoringFeature<Schema<typeof NODE_TYPES[number]>> = {

    getPlugins() {
      return [
        new Plugin({
          props: {
            nodeViews: {
              link: (node, view, getPos) => {
                return new LinkView(node, view, getPos);
              },
            },
          },
        }),
      ];
    },

    getMenuOptions(schema) {
      return {
        inline: {
          link: {
            label: "Make a link",
            active: blockActive(schema.nodes.link),
            enable: (state) => {
              return insertPoint(state.doc, state.selection.from, schema.nodes.link) != null;
            },
            run: (state, dispatch) => {
              const { empty, $from, $to } = state.selection;
              let content = Fragment.empty;

              if (!empty && $from.sameParent($to) && $from.parent.inlineContent) {
                content = $from.parent.content.cut($from.parentOffset, $to.parentOffset);
              }

              dispatch!(
                state.tr.replaceSelectionWith(
                  schema.nodes.link.create(
                    { schemaID: 'web', reference: 'https://example.com/' },
                    content)));
            },
          },
        },
      };
    },

  };

  return feature;
}
