const a=l=>/^(?:Model_VOL\d*|Vol)(?:_\d+)?$/.test(l);function o(l){l.traverse(e=>{(a(e.name)||e.name==="Model_Vol"||e.name==="Vol_AniDummy")&&(e.visible=!1)})}export{o as h,a as i};
