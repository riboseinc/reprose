import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import { nodes as basicNodes } from 'prosemirror-schema-basic';


export interface SchemaFeature<N extends string = any, M extends string = any> {
  nodes?: Record<N, NodeSpec>
  marks?: Record<M, MarkSpec>
}


export interface FeatureOptions {
  allowBlocks?: boolean
}


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
        doc: { content: "block+ section*" },
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
