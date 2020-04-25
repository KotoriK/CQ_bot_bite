# CQ_QQRobot_Bite
一个致力于复刻[竹竹](https://github.com/Tsuk1ko/CQ-picfinder-robot/) 禁言功能的插件。现在经重写，可以独立于竹竹运行。

## 开源协议
GNU General Public License v3.0
## 功能简述
1. 禁言
## 使用方法
0. 首先，请知悉这个插件仅支持基于[momocow/node-cq-websocket](https://github.com/momocow/node-cq-websocket)的项目。
1. 修改tsconfig.json,运行```npm run build```编译成你使用的Node.js支持的ECMAScript版本，或者直接使用编译好的ES6版(bite.js)
2. 将bite.js放入任何你想要放的地方
3. 参照以下代码初始化：
```javascript
import {Bite} from './bite';//在头部加入这条，引号内是相对路径
import config from './config'
//在初始化阶段引入
const bot = new CQWebSocket()
const bite = new Bite(bot,config.bite)
//config.bite 的格式参见bite.ts中的@interface BiteSetting,你可以不传入来使用默认设置

//需要禁用时，调用:
bite.off()
```
4. 在群里发“竹竹咬我”，就可以被竹竹咬了；或者“竹竹咬他@你要咬的人”来让竹竹咬别人；你也可以修改bite.ts中的如下所示的正则表达式更换触发指令。
```typescript
 doBite(context: Record<string, any>): boolean {
        if (context.message_type != "group" || context.message_type != "discuss") return false;
        let re = /^竹竹[^我他她它\s]+([我他她它])$/u.exec(this.deCQ(context.raw_message)) //更改这里的正则表达式
        if (!re) return false; //检查是否符合RegEx
        const myQQid = context.self_id
        //......
```

## 未来更新（如果有
1. 完整移植原版行为（可能吧
2. 兼容匿名禁言

（结果并没有更新，只是用Typescript重写了下...
