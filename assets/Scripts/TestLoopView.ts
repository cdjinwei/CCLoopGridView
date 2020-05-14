// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import LoopGridView from "../CustomComponents/LoopGridView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property({
        type: LoopGridView,
        displayName: 'LoopGridView'
    })
    loopGridView: LoopGridView;
    
    @property({
        type: cc.EditBox,
        displayName: '更新索引'
    })
    updateEditBox: cc.EditBox;

    @property({
        type: cc.EditBox,
        displayName: '删除索引'
    })
    deleteEditBox: cc.EditBox;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        let list = new Array(8);
        for(let i = 0; i < list.length; i++){
            list[i] = i;
        }
        this.loopGridView.initItemData(list);
    }

    updateData(event: cc.Event.EventTouch) {
        this.loopGridView.updateItemData(parseInt(this.updateEditBox.string), Math.random() * 10);
    }

    deleteData(event: cc.Event.EventTouch) {
        this.loopGridView.deleteItem(parseInt(this.deleteEditBox.string));
    }
    // update (dt) {}
}
