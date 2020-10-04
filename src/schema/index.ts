import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
//import OrderedMap from 'orderedmap';


export interface SchemaFeature<N extends string = any, M extends string = any> {
  //schema: Schema<N, M>
  nodes?: Record<N, NodeSpec>
  marks?: Record<M, MarkSpec>
}


export default function featuresToSchema<K extends SchemaFeature[]>
(features: K):
Schema<any, any> {

  //const schema = features.map(f => f.schema).reduce((prev, curr) => {

  //  const nodes = OrderedMap.from<NodeSpec>({
  //    ...prev.spec.nodes,
  //    ...curr.spec.nodes,
  //  } as { [key: string]: NodeSpec });

  //  const marks = OrderedMap.from<MarkSpec>({
  //    ...prev.spec.marks,
  //    ...curr.spec.marks,
  //  } as { [key: string]: MarkSpec });

  //  return new Schema({ nodes, marks });

  //}, new Schema({ nodes: { doc: { content: "block+" } } }));

  //debugger;
  //console.info("GOT SCHEMA", schema);

  //return schema;

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
