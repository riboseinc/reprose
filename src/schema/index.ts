import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';


export interface SchemaFeature<N extends string = any, M extends string = any> {
  nodes?: Record<N, NodeSpec>
  marks?: Record<M, MarkSpec>
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

  if (Object.keys(nodes).length < 1) {
    throw new Error("Reprose: No node definitions found across given features");
  }

  return new Schema({
    nodes: {
      doc: { content: "block+" },
      text: { group: "inline" },
      ...nodes,
    },
    marks,
  });

}
