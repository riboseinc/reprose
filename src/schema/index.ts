import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import { nodes as basicNodes } from 'prosemirror-schema-basic';


/**
 * A _schema feature_ is an object that encapsulates specs
 * for custom ProseMirror nodes and marks. It is an attempt to make
 * ProseMirror schema aspects reusable.
 *
 * Type arguments N and M represent allowed node and mark type strings.
 */
export interface SchemaFeature<N extends string = any, M extends string = any> {
  nodes?: Record<N, NodeSpec>
  marks?: Record<M, MarkSpec>
}


/**
 * Features that are initialized via factory functions
 * can support options. This represents commonly used options.
 */
export interface FeatureOptions {
  allowBlocks?: boolean
}


/** Takes a list of schema features and combines them into a ProseMirror’s Schema instance. */
export default function featuresToSchema<K extends SchemaFeature[]>
(features: K):
Schema<any, any> {

  const nodes = features.
    map(f => f.nodes || {}).
    reduce((p, c) => ({ ...p, ...c }), {});

  const marks = features.
    map(f => f.marks || {}).
    reduce((p, c) => ({ ...p, ...c }), {});

  if (Object.keys(nodes).length > 0) {
    return new Schema({
      nodes: {
        doc: { content: "(block | sectioning)+" },
        text: { group: "inline" },
        ...nodes,
      },
      marks,
    });

  } else {
    return new Schema({
      nodes: {
        doc: { content: "block" },
        text: { group: "inline" },
        paragraph: basicNodes.paragraph,
      },
      marks,
    });

  }
}
