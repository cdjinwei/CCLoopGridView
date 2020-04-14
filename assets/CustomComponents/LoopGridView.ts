// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import LoopGridItem from "./LoopGridItem";

const { ccclass, property } = cc._decorator;

enum ListType {
    VERTICAL,
    HORIZONTAL,
    GRID
}

enum DirectionHorizontal {
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT
}

enum DirectionVertical {
    TOP_TO_BOTTOM,
    BOTTOM_TO_TOP
}

enum DirectionGird {
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT,
    TOP_TO_BOTTOM,
    BOTTOM_TO_TOP
}

@ccclass
export default class LoopGridView extends cc.Component {

    @property({
        type: cc.Float,
        displayName: '刷新频率',
        tooltip: '调用ScrollView的频率，对于所有onScroll事件，每间隔n个onScroll事件会实际执行一次onScroll',
        min: 0
    })
    scrollCheckDt: number = 0;

    scrollCheckCD: number = 0;

    @property({
        type: cc.Prefab,
        displayName: '模板预设',
    })
    itemTemplate: cc.Prefab;

    @property({
        type: cc.Enum(ListType),
        displayName: '列表类型'
    })
    listType: ListType = ListType.VERTICAL;

    @property({
        type: cc.Enum(DirectionHorizontal),
        displayName: '排列方向',
        tooltip: '子节点的排列方向',
        visible: function () {
            return this.listType == ListType.HORIZONTAL;
        }
    })
    directionHorizontal: DirectionHorizontal = DirectionHorizontal.LEFT_TO_RIGHT;

    @property({
        type: cc.Enum(DirectionVertical),
        displayName: '排列方向',
        tooltip: '子节点的排列方向',
        visible: function () {
            return this.listType == ListType.VERTICAL;
        }
    })
    directionVertical: DirectionVertical = DirectionVertical.TOP_TO_BOTTOM;

    @property({
        type: cc.Enum(DirectionGird),
        displayName: '排列方向',
        tooltip: '子节点的排列方向',
        visible: function () {
            return this.listType == ListType.GRID;
        }
    })
    directionGrid: DirectionGird = DirectionGird.TOP_TO_BOTTOM;

    @property({
        type: cc.Float,
        displayName: '水平间隔',
        visible: function () {
            return this.listType == ListType.HORIZONTAL || this.listType == ListType.GRID;
        }
    })
    horizontalGap: number = 0;

    @property({
        type: cc.Float,
        displayName: '垂直间隔',
        visible: function () {
            return this.listType == ListType.VERTICAL || this.listType == ListType.GRID;
        }
    })
    verticalGap: number = 0;

    @property({
        type: cc.Node,
        displayName: 'Content'
    })
    content: cc.Node;

    private itemDataList: Array<any>;
    private itemNodeList: any = {};
    private itemPool: cc.NodePool = new cc.NodePool();

    private leftLimit: number = 0;
    private rightLimit: number = 0;
    private topLimit: number = 0;
    private bottomLimit: number = 0;

    private startIndex: number = 0;
    private endIndex: number = 0;
    private visibleCount: number = 0;
    private rowCount: number = 0;
    private colCount: number = 0;

    private interactable: boolean = true;
    private dirty: boolean = false;
    onLoad() {
        console.log('onLoad');
    }

    onEnable() {
        console.log('onEanable');
    }

    start() {
        console.log('start');
        if (this.itemTemplate == undefined) {
            console.error('itemTemplate can not be null!');
            return;
        }

        this.content.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.content.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.content.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        this.itemPool.clear();
    }

    private onTouchStart(event) {
        if(!this.interactable) return;
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if(!this.interactable) return;
        this.onScroll(event);
    }

    private onTouchEnd(event) {
        if(!this.interactable) return;
    }

    private initItemNodes() {
        for (let i = 0; i < Math.min(this.visibleCount, this.itemDataList.length); i++) {
            let index = i + this.startIndex;
            this.createItemNode(index);
        }
    }

    private createItem(): cc.Node {
        let item = this.itemPool.get();
        if (item == undefined) {
            console.log("create new node");
            item = cc.instantiate(this.itemTemplate);
        }
        return item;
    }

    private recycleItem(index: number) {
        this.itemPool.put(this.itemNodeList[index]);
        delete this.itemNodeList[index];
    }

    private createItemNode(index) {
        let newNode = this.createItem();
        newNode.parent = this.content;
        newNode.position = this.calcItemPosition(index);
        newNode.scale = 0;
        this.itemNodeList[index] = newNode;
        let cmp = newNode.getComponent(LoopGridItem);
        cmp.onRender(this.itemDataList[index]);
        cmp.runShowAnim();
    }

    private initViewInfo() {
        switch (this.listType) {
            case ListType.HORIZONTAL:
                this.visibleCount = Math.ceil(this.node.width / (this.itemTemplate.data.width + this.horizontalGap)) + 1;
                this.startIndex = 0;
                this.endIndex = this.startIndex + this.visibleCount - 1;
                break;
            case ListType.VERTICAL:
                this.visibleCount = Math.ceil(this.node.height / (this.itemTemplate.data.height + this.verticalGap)) + 1;
                this.startIndex = 0;
                this.endIndex = this.startIndex + this.visibleCount - 1;
                break;
            case ListType.GRID:
                if (this.directionGrid == DirectionGird.LEFT_TO_RIGHT || this.directionGrid == DirectionGird.RIGHT_TO_LEFT) {
                    this.rowCount = Math.floor(this.node.height / (this.itemTemplate.data.height + this.verticalGap));
                    //实际列数
                    this.colCount = Math.ceil(this.itemDataList.length / this.rowCount);
                    //可视列数
                    let visibleCol = Math.ceil(this.node.width / (this.itemTemplate.data.width + this.horizontalGap)) + 1;
                    //可视item数
                    this.visibleCount = visibleCol * this.rowCount;

                    this.startIndex = 0;
                    this.endIndex = this.startIndex + this.visibleCount - 1;
                } else {
                    this.colCount = Math.floor(this.node.width / (this.itemTemplate.data.width + this.horizontalGap));
                    //实际行数
                    this.rowCount = Math.ceil(this.itemDataList.length / this.colCount);
                    //可视行数
                    let visibleRow = Math.ceil(this.node.height / (this.itemTemplate.data.height + this.verticalGap)) + 1;
                    //可视item数
                    this.visibleCount = visibleRow * this.colCount;

                    this.startIndex = 0;
                    this.endIndex = this.startIndex + this.visibleCount - 1;
                }
                break;
        }
    }

    private initViewSizeInfo() {
        if (this.listType == ListType.GRID) {
            if (this.directionGrid == DirectionGird.LEFT_TO_RIGHT) {
                this.content.width = (this.itemDataList.length * (this.itemTemplate.data.width + this.horizontalGap)) - this.horizontalGap;
                this.content.anchorX = 0;
                this.content.anchorY = 0.5;
                this.content.x = -this.node.width / 2;
                this.content.y = 0;

                this.leftLimit = this.content.x - (this.content.width - this.node.width);
                this.rightLimit = this.content.x;
            } else if (this.directionGrid == DirectionGird.RIGHT_TO_LEFT) {
                this.content.width = (this.itemDataList.length * (this.itemTemplate.data.width + this.horizontalGap)) - this.horizontalGap;
                this.content.anchorX = 1;
                this.content.anchorY = 0.5;
                this.content.x = this.node.width / 2;
                this.content.y = 0;

                this.leftLimit = this.content.x;
                this.rightLimit = this.content.x + (this.content.width - this.node.width);
            } else if (this.directionGrid == DirectionGird.TOP_TO_BOTTOM) {
                this.content.height = (this.rowCount * (this.itemTemplate.data.height + this.verticalGap)) - this.verticalGap;
                this.content.anchorX = 0.5;
                this.content.anchorY = 1;
                this.content.x = 0;
                this.content.y = this.node.height / 2;

                this.bottomLimit = this.content.y;
                this.topLimit = this.content.y + (this.content.height - this.node.height);
            } else if (this.directionGrid == DirectionGird.BOTTOM_TO_TOP) {
                this.content.height = (this.rowCount * (this.itemTemplate.data.height + this.verticalGap)) - this.verticalGap;
                this.content.anchorX = 0.5;
                this.content.anchorY = 0;
                this.content.x = 0;
                this.content.y = -this.node.height / 2;

                this.bottomLimit = this.content.y - (this.content.height - this.node.height);
                this.topLimit = this.content.y;
            }
        } else if (this.listType == ListType.HORIZONTAL) {
            this.content.width = (this.itemDataList.length * (this.itemTemplate.data.width + this.horizontalGap)) - this.horizontalGap;
            if (this.directionHorizontal == DirectionHorizontal.LEFT_TO_RIGHT) {
                this.content.anchorX = 0;
                this.content.anchorY = 0.5;
                this.content.x = -this.node.width / 2;
                this.content.y = 0;

                this.leftLimit = this.content.x - (this.content.width - this.node.width);
                this.rightLimit = this.content.x;
            } else {
                this.content.anchorX = 1;
                this.content.anchorY = 0.5;
                this.content.x = this.node.width / 2;
                this.content.y = 0;

                this.leftLimit = this.content.x;
                this.rightLimit = this.content.x + (this.content.width - this.node.width);
            }

        } else if (this.listType == ListType.VERTICAL) {
            this.content.height = (this.itemDataList.length * (this.itemTemplate.data.height + this.verticalGap)) - this.verticalGap;

            if (this.directionVertical == DirectionVertical.TOP_TO_BOTTOM) {
                this.content.anchorX = 0.5;
                this.content.anchorY = 1;
                this.content.x = 0;
                this.content.y = this.node.height / 2;

                this.bottomLimit = this.content.y;
                this.topLimit = this.content.y + (this.content.height - this.node.height);
            } else {
                this.content.anchorX = 0.5;
                this.content.anchorY = 0;
                this.content.x = 0;
                this.content.y = -this.node.height / 2;

                this.bottomLimit = this.content.y - (this.content.height - this.node.height);
                this.topLimit = this.content.y;
            }

        }
    }

    private refreshContentSize() {
        if (this.listType == ListType.GRID) {
            if (this.directionGrid == DirectionGird.LEFT_TO_RIGHT) {
                this.content.width = (this.itemDataList.length * (this.itemTemplate.data.width + this.horizontalGap)) - this.horizontalGap;
            } else if (this.directionGrid == DirectionGird.RIGHT_TO_LEFT) {
                this.content.width = (this.itemDataList.length * (this.itemTemplate.data.width + this.horizontalGap)) - this.horizontalGap;
            } else if (this.directionGrid == DirectionGird.TOP_TO_BOTTOM) {
                this.content.height = (this.rowCount * (this.itemTemplate.data.height + this.verticalGap)) - this.verticalGap;
            } else if (this.directionGrid == DirectionGird.BOTTOM_TO_TOP) {
                this.content.height = (this.rowCount * (this.itemTemplate.data.height + this.verticalGap)) - this.verticalGap;
            }
        } else if (this.listType == ListType.HORIZONTAL) {
            this.content.width = (this.itemDataList.length * (this.itemTemplate.data.width + this.horizontalGap)) - this.horizontalGap;
        } else if (this.listType == ListType.VERTICAL) {
            this.content.height = (this.itemDataList.length * (this.itemTemplate.data.height + this.verticalGap)) - this.verticalGap;
        }
    }

    public initItemData(itemDataList: Array<any>) {
        this.itemDataList = itemDataList;

        this.initViewInfo();
        this.initViewSizeInfo();
        this.initItemNodes();
    }

    public insertItemData(itemData: any, index: number = 0) {
        //过程中不允许用户与ui交互
        this.interactable = false;
        //插入一条数据
        //1.找到插入的位置
        //2.将插入位置以及位置以下的item‘向下’移动一个item的距离
        //2.1.如果下移的item超出最大可视范围，清理掉超出的item
        //3.将数据插入该位置
        //4.创建新的item，播放插入动画
        //5.完成插入
    }

    public deleteItemData(index: number = 0) {
        let deleteItem: cc.Node = this.itemNodeList[index];
        this.itemDataList.splice(index, 1);
        this.refreshContentSize();
        this.refreshView();
        // if(deleteItem == undefined){
        //     return;
        // }
        // this.interactable = false;

        // let cmp: LoopGridItem = deleteItem.getComponent(LoopGridItem);
        // cmp.runDeleteAnim(() => {
        //     this.interactable = true;
        //     deleteItem.destroy();
        //     delete this.itemNodeList[index];
        //     for(let i = index + 1; i < this.itemDataList.length; i++){
        //         let item = this.itemNodeList[i];

        //         if(item == undefined) break;
        //         let newIndex = i - 1;
        //         this.itemNodeList[newIndex] = item;
        //         delete this.itemNodeList[i];
        //         cc.tween(item).to(0.15, {position: this.calcItemPosition(newIndex)}).start();
        //     }
        // });

        //1.被删除的数据在可视区域'上方'
        //1.1 将数据从itemDataList中删除
        //1.2 更新content长度
        //1.3 更新itemNode的位置
        //2.被删除的数据在可视区域'中'
        //3.被删除的数据在可视区域'下方'
    }

    public updateItemData(index: number, itemData: any) {
        if (index < 0 || index >= this.itemDataList.length) {
            console.warn(`index: ${index} out of range`);
            return;
        }

        this.itemDataList[index] = itemData;
        
        if(this.itemNodeList[index] != undefined){
            let cmp: LoopGridItem = this.itemNodeList[index].getComponent(LoopGridItem);
            cmp.onRender(itemData);
        }
    }

    public findItemDataIndex(): number {
        return 1;
    }

    private onScroll(event: cc.Event.EventTouch) {
        this.updateContentPosition(event);

        //控制刷新频率
        if (this.scrollCheckCD > 0) {
            this.scrollCheckCD--;
            return;
        } else {
            this.scrollCheckCD = this.scrollCheckDt;
        }

        this.refreshView();
    }

    private refreshView() {
        let { newStartIndex, newEndIndex } = this.calcIndex();
        if (this.startIndex == newStartIndex) return;


        if (this.startIndex > newStartIndex) {
            for (let i = newStartIndex; i <= this.endIndex; i++) {
                if (i <= this.startIndex) {
                    if (this.itemNodeList[i] == undefined) {
                        this.createItemNode(i);
                    }
                } else if (i > newEndIndex) {
                    if (this.itemNodeList[i] != undefined) {
                        this.recycleItem(i);
                    }
                } else if(this.dirty) {
                    this.itemNodeList[i].position = this.calcItemPosition(i);
                }
            }
        } else {
            for (let i = this.startIndex; i <= newEndIndex; i++) {
                if (i < newStartIndex) {
                    if (this.itemNodeList[i] != undefined) {
                        this.recycleItem(i);
                    }
                } else if (i >= this.endIndex) {
                    if (this.itemNodeList[i] == undefined) {
                        this.createItemNode(i);
                    }
                } else if(this.dirty){
                    this.itemNodeList[i].position = this.calcItemPosition(i);
                }
            }
        }
        this.startIndex = newStartIndex;
        this.endIndex = newEndIndex;
        this.dirty = false;
    }

    private updateContentPosition(event: cc.Event.EventTouch) {
        let delta = event.getDelta();

        switch (this.listType) {
            case ListType.HORIZONTAL:
                this.updateHorizontalContentPosition(delta);
                break;
            case ListType.VERTICAL:
                this.updateVerticalContentPosition(delta);
                break;
            case ListType.GRID:
                this.updateGridContentPosition(delta);
                break;
        }
    }

    private updateVerticalContentPosition(delta: cc.Vec2) {
        let tempY = this.content.y + delta.y;
        tempY = Math.min(tempY, this.topLimit);
        tempY = Math.max(tempY, this.bottomLimit);

        this.content.y = tempY;
    }

    private updateHorizontalContentPosition(delta: cc.Vec2) {
        let tempX = this.content.x + delta.x;
        tempX = Math.min(tempX, this.rightLimit);
        tempX = Math.max(tempX, this.leftLimit);

        this.content.x = tempX;
    }

    private updateGridContentPosition(delta: cc.Vec2) {
        if (this.directionGrid == DirectionGird.LEFT_TO_RIGHT || this.directionGrid == DirectionGird.RIGHT_TO_LEFT) {
            this.updateHorizontalContentPosition(delta);
        } else {
            this.updateVerticalContentPosition(delta);
        }
    }

    private calcIndex(): any {

        let newStartIndex: number, newEndIndex: number;

        switch (this.listType) {
            case ListType.HORIZONTAL:
                let contentX = this.content.x, originX;
                if (this.directionHorizontal == DirectionHorizontal.LEFT_TO_RIGHT) {
                    originX = this.rightLimit;
                } else {
                    originX = this.leftLimit;
                }
                let offsetX = Math.abs(originX - contentX);
                newStartIndex = Math.floor(offsetX / (this.itemTemplate.data.width + this.horizontalGap));
                //index从0开始
                newEndIndex = newStartIndex + this.visibleCount - 1;
                break;
            case ListType.VERTICAL:
                let contentY = this.content.y, originY;
                if (this.directionVertical == DirectionVertical.TOP_TO_BOTTOM) {
                    originY = this.bottomLimit;
                } else {
                    originY = this.topLimit;
                }
                let offsetY = Math.abs(originY - contentY);
                newStartIndex = Math.floor(offsetY / (this.itemTemplate.data.height + this.verticalGap));
                //index从0开始
                newEndIndex = newStartIndex + this.visibleCount - 1;
                break;
            case ListType.GRID:
                if (this.directionGrid == DirectionGird.TOP_TO_BOTTOM) {
                    let originY = this.bottomLimit;
                    let offsetY = Math.abs(originY - this.content.y);
                    let rowIndex = Math.floor(offsetY / (this.itemTemplate.data.height + this.verticalGap));
                    newStartIndex = rowIndex * this.colCount;
                    //index从0开始
                    newEndIndex = newStartIndex + this.visibleCount - 1;
                } else if (this.directionGrid == DirectionGird.BOTTOM_TO_TOP) {
                    let originY = this.topLimit;
                    let offsetY = Math.abs(originY - this.content.y);
                    let rowIndex = Math.floor(offsetY / (this.itemTemplate.data.height + this.verticalGap));
                    newStartIndex = rowIndex * this.colCount;
                    //index从0开始
                    newEndIndex = newStartIndex + this.visibleCount - 1;
                } else if (this.directionGrid == DirectionGird.LEFT_TO_RIGHT) {

                } else if (this.directionGrid == DirectionGird.RIGHT_TO_LEFT) {

                }
                break;
        }

        newStartIndex = newStartIndex >= 0 ? newStartIndex : 0;
        newEndIndex = newEndIndex < this.itemDataList.length ? newEndIndex : this.itemDataList.length - 1;

        return { newStartIndex, newEndIndex };
    }

    private calcItemPosition(index): cc.Vec2 {
        let position: cc.Vec2;

        switch (this.listType) {
            case ListType.HORIZONTAL:
                position = this.calcHorizontalItemPosition(index);
                break;
            case ListType.VERTICAL:
                position = this.calcVerticalItemPosition(index);
                break;
            case ListType.GRID:
                position = this.calcGridItemPosition(index);
                break;
        }

        return position;
    }

    private calcHorizontalItemPosition(index: number): cc.Vec2 {
        let position: cc.Vec2;
        if (this.directionHorizontal == DirectionHorizontal.LEFT_TO_RIGHT) {
            position = new cc.Vec2(
                0 + (this.itemTemplate.data.width + this.horizontalGap) * index + this.itemTemplate.data.width / 2,
                0
            );
        } else {
            position = new cc.Vec2(
                0 - (this.itemTemplate.data.width + this.horizontalGap) * index - this.itemTemplate.data.width / 2,
                0
            );
        }

        return position;
    }

    private calcVerticalItemPosition(index: number): cc.Vec2 {
        let position: cc.Vec2;
        if (this.directionVertical == DirectionVertical.TOP_TO_BOTTOM) {
            position = new cc.Vec2(
                0,
                0 - (this.itemTemplate.data.height + this.verticalGap) * index - this.itemTemplate.data.height / 2
            );
        } else {
            position = new cc.Vec2(
                0,
                0 + (this.itemTemplate.data.height + this.verticalGap) * index + this.itemTemplate.data.height / 2
            );
        }
        return position;
    }

    private calcGridItemPosition(index: number): cc.Vec2 {
        let position: cc.Vec2;
        let row = Math.floor(index / this.colCount);
        let col = index % this.colCount;
        switch (this.directionGrid) {
            case DirectionGird.TOP_TO_BOTTOM:
                {
                    let left = -this.content.width / 2;
                    let right = this.content.width / 2;
                    let cellWidth = this.content.width / this.colCount;

                    let _left = left + cellWidth * col;
                    let _right = left + cellWidth * (col + 1);


                    position = new cc.Vec2(
                        (_left + _right) / 2,
                        0 - (this.itemTemplate.data.height + this.verticalGap) * row - this.itemTemplate.data.height / 2
                    );
                }
                break;
            case DirectionGird.BOTTOM_TO_TOP:
                {
                    let left = -this.content.width / 2;
                    let right = this.content.width / 2;
                    let cellWidth = this.content.width / this.colCount;

                    let _left = left + cellWidth * col;
                    let _right = left + cellWidth * (col + 1);


                    position = new cc.Vec2(
                        (_left + _right) / 2,
                        (this.itemTemplate.data.height + this.verticalGap) * row + this.itemTemplate.data.height / 2
                    );
                }
                break;
            case DirectionGird.LEFT_TO_RIGHT:
                break;
            case DirectionGird.RIGHT_TO_LEFT:
                break;
        }

        return position;
    }
}
