import type { Schema } from 'prosemirror-model';
import type { MenuOption } from './menu';
import type { MarkType, NodeType } from 'prosemirror-model';
import type { EditorState, NodeSelection, Selection } from 'prosemirror-state';


function isNodeSelection(selection: Selection): selection is NodeSelection {
  return selection.hasOwnProperty('node');
}


export const blockActive =
<S extends Schema>(type: NodeType<S>, attrs: Record<string, any> = {}): MenuOption<S>["active"] =>
(state: EditorState<S>) => {
  const { $from, to } = state.selection;

  if (isNodeSelection(state.selection) && state.selection.node) {
    return state.selection.node.hasMarkup(type, attrs);
  } else {
    return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
  }
}


export const markActive =
<S extends Schema>(type: MarkType<S>): MenuOption<S>["active"] =>
(state: EditorState<S>) => {
  const { from, $from, to, empty } = state.selection;

  const result = empty
    ? type.isInSet(state.storedMarks || $from.marks())
    : state.doc.rangeHasMark(from, to, type);

  return result !== null && result !== undefined && result !== false;
}


export const canInsert =
<S extends Schema>(type: NodeType<S>): MenuOption<S>["active"] =>
(state: EditorState<S>) => {
  const { $from } = state.selection;

  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d);

    if ($from.node(d).canReplaceWith(index, index, type)) {
      return true;
    }
  }

  return false;
}
