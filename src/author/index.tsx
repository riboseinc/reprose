import React from 'react';

import { EditorState } from 'prosemirror-state';
import { toggleMark } from 'prosemirror-commands';

//import { MenuBar } from './menu';
//import type { EditorProps } from './editor';


interface Feature {
  content?: JSX.Element
  label: string
  active: (state: EditorState) => boolean
  run: ReturnType<typeof toggleMark>
}


// export default function featuresToEditorProps(features: Feature[]):
// Omit<EditorProps, 'onChange' | 'logger' | 'initialDoc' | 'key' | 'css' | 'style' | 'className'> {
//   return {
//     render: ({ editor, view }) => (
//       <>
//         <MenuBar view={view} />
//       </>
//     )
//   }
//   // Test
// }


//const MenuBar: React.FC<any> = function () { return <p>hey</p> }
