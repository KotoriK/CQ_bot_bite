# CQ_QQRobot_Bite
一个附加于[竹竹](https://github.com/Tsuk1ko/CQ-picfinder-robot/) 的娱乐向禁言插件。

## 功能简述
1. 禁言
## 使用方法
1. 将bite.js放入\CQ-picfinder-robot\modules\plugin\内
2. 修改main.js，
```javascript
import doBite from './modules/plugin/bite';//在头部加入这条

//在消息处理部分加入：
//举个例子
function privateAndAtMsg(e,context){
//other code
  if(doBite(context,replyMsg,bot)return;
//other code
}
```
3. 在群里发“竹竹咬我”，就可以被竹竹咬了；或者“竹竹咬他@你要咬的人”来让竹竹咬别人；

## 未来更新（如果有
1. 完整移植原版行为（可能吧
