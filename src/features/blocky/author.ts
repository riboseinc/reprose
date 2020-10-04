import type { Schema } from 'prosemirror-model';
import { lift, joinUp, joinDown, selectParentNode } from 'prosemirror-commands';
import { AuthoringFeature } from '../../author';


const feature: AuthoringFeature<Schema<any, any>> = {

  getKeymap(schema) {
    return {
      'Mod-BracketLeft': lift,
      'Alt-ArrowUp': joinUp,
      'Alt-ArrowDown': joinDown,
      'Escape': selectParentNode,
    };
  },

  getMenuOptions(schema) {
    return {
      blocks: {
        lift: {
          label: 'Lift out of enclosing block',
          enable: lift,
          run: lift,
        },
        join_up: {
          label: 'Join with above block',
          enable: joinUp,
          run: joinUp,
        },
      },
    };
  },

};


export default feature;
