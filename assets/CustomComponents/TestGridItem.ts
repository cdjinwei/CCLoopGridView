// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
import LoopGridItem from "./LoopGridItem";


@ccclass
export default class TestGridItem extends LoopGridItem {
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    @property({
        type: cc.Label
    })
    label: cc.Label;

    start () {

    }

    onRender(itemData: any): void {
        this.label.string = itemData;
    }

    // update (dt) {}
}
