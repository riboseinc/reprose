import React from 'react';
import ReactDOM from 'react-dom';

import '@babel/polyfill';
// Complains about regeneratorRuntime without ^^

import { Step, StepMap } from 'prosemirror-transform';
import { insertPoint } from 'prosemirror-transform';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { Fragment, Node, Schema } from 'prosemirror-model';
import { NodeView, EditorView } from 'prosemirror-view';
import { AuthoringFeature, blockActive } from '../../author';
import { LinkNodeAttrs, NODE_TYPES } from './schema';


export interface LinkAttributeEditorProps {
  React: typeof React
  schemas: LinkSchemas
  attrs: LinkNodeAttrs
  onAttrsChanged: (attrs: LinkNodeAttrs) => void
}

const LinkEditor: React.FC<LinkAttributeEditorProps> = function ({
    React,
    schemas, attrs, onAttrsChanged,
}) {
  const [editedAttrs, updateEditedAttrs] = React.useState<LinkNodeAttrs | null>(null);

  function handleConfirm() {
    if (editedAttrs !== null) {
      onAttrsChanged(editedAttrs);
    }
  }

  const att = editedAttrs || attrs;

  return (
    <>
      <select
          value={att.schemaID}
          onChange={evt => updateEditedAttrs({ ...att, schemaID: evt.currentTarget.value })}>
        {Object.entries(schemas).map(([schemaID, schemaOpts]) =>
          <option key={schemaID} value={schemaID}>{schemaOpts.entityTypeLabel}</option>
        )}
      </select>
      <input
        tabIndex={1}
        value={att.reference}
        onChange={evt => updateEditedAttrs({ ...att, reference: evt.currentTarget.value })}
      />
      <button disabled={editedAttrs === null} onClick={handleConfirm}>Update link</button>
    </>
  );
};


// NOTE: Terminology clash: The “schema” in “link schema” here does not mean “schema” in ProseMirror sense.
// It merely stands for a type of links that the user can enter.
export type LinkSchemas = { [schemaID: string]: LinkSchema }
export interface LinkSchema {
  entityTypeLabel: string
  resolveReference: (ref: string) => Promise<Partial<Pick<LinkNodeAttrs, 'hRef' | 'title'>>>
  validateReference: (ref: string) => Promise<string[]>
  sanitizeReference: (ref: string) => Promise<string>
}


export const DEFAULT_SCHEMAS: LinkSchemas = {
  web: {
    entityTypeLabel: "URL",
    resolveReference: async (ref) => {
      return { hRef: ref };
    },
    validateReference: async (loc) => {
      try {
        const url = new URL(loc);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return ["URL is using unknown protocol"]
        }
        if (url.protocol !== 'https:') {
          return ["URL is not using secure protocol"];
        }
      } catch (e) {
        return ["URL does not seem to be correctly formatted"];
      }
      return [];
    },
    sanitizeReference: async (ref) => {
      // TODO: Can check whether HTTPS works and fall back to HTTP if not
      try {
        const url = ref.startsWith('http') ? ref : `https://${ref}`;
        const actualURL = new URL(url);
        if (actualURL.protocol !== 'http' && actualURL.protocol !== 'https') {
          return ref;
        }
        return actualURL.toString().toLowerCase().trim();
      } catch (e) {
        return ref;
      }
    },
  },
};


interface FeatureOptions {
  floatingLinkEditorClassName?: string
  schemas?: LinkSchemas
  LinkEditor?: React.FC<LinkAttributeEditorProps>
}


export default function getFeature(opts?: FeatureOptions) {

  const schemas = opts?.schemas || DEFAULT_SCHEMAS;

  const LinkAttributeEditor = opts?.LinkEditor || LinkEditor;

  type LinkInnerSchema = Schema<'text'>;

  class LinkView<S extends Schema<any, any>> implements NodeView<S> {
    // The implementation is based on the canonical ProseMirror’s footnote example

    node: Node<S>
    dom: HTMLSpanElement
    outerView: EditorView<S>
    innerView: EditorView<Schema<'text'>> | null
    linkEditor: HTMLDivElement | null

    constructor(
        node: Node<S>,
        view: EditorView<S>,
        private getPos: boolean | (() => number),
        private reactCls: typeof React) {
      this.node = node;
      this.outerView = view;
      this.getPos = getPos;
      this.dom = document.createElement('a');
      this.dom.textContent = node.textContent;
      this.innerView = null;
      this.linkEditor = null;
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

    renderAttributeEditor(container: HTMLSpanElement) {
      ReactDOM.render(<LinkAttributeEditor
        React={this.reactCls}
        schemas={schemas}
        attrs={this.node.attrs as LinkNodeAttrs}
        onAttrsChanged={attrs => {
          if (typeof this.getPos === "function") {
            this.outerView.dispatch(
              this.outerView.state.tr.setNodeMarkup(this.getPos(), undefined, attrs));
            setTimeout((() => this.open()), 200);
          } else {
            console.error("getPos is not a function");
          }
        }}
      />, container, () => {
        this.linkEditor?.querySelector('input')?.focus();
      });
    }

    open() {
      // Append a floater to the outer node
      this.linkEditor = this.dom.appendChild(document.createElement('div'));
      this.linkEditor.className = opts?.floatingLinkEditorClassName || 'link-editor';
      if (typeof this.getPos === "function") {
        // Position link editor right on top of link.
        const { left, top } = this.outerView.coordsAtPos(this.getPos());
        this.linkEditor.style.left = `${left}px`;
        this.linkEditor.style.top = `${top}px`;
      }

      const linkAttributeEditor = this.linkEditor.appendChild(document.createElement('div'));
      linkAttributeEditor.classList.add('attribute-editor');
      this.renderAttributeEditor(linkAttributeEditor);
      const linkTextEditor = this.linkEditor.appendChild(document.createElement('div'));

      // And put a sub-ProseMirror into that
      this.innerView = new EditorView<LinkInnerSchema>(linkTextEditor, {
        // You can use any node as an editor document
        state: EditorState.create({
          doc: this.node,
          //plugins: [keymap({
          //  "Mod-z": () => undo(this.outerView.state, this.outerView.dispatch),
          //  "Mod-y": () => redo(this.outerView.state, this.outerView.dispatch)
          //})],
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

      const attributeEditorContainer = this.linkEditor?.querySelector('attribute-editor');
      if (attributeEditorContainer) {
        ReactDOM.unmountComponentAtNode(attributeEditorContainer);
      }

      this.linkEditor?.remove();
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
            state.doc.content as Fragment<S>);

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
      return true;
    }
    destroy() {
      this.close();
    }

    stopEvent(event: any) {
      if (this.innerView !== null && this.linkEditor?.contains(event.target)) {
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

    getPlugins(schema, React) {
      return [
        new Plugin({
          props: {
            nodeViews: {
              link: (node, view, getPos) => {
                return new LinkView(node, view, getPos, React);
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
