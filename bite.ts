import { CQWebSocket, CQEvent, CQTag, MessageListenerReturn } from 'cq-websocket'//只是为了Typescript中的代码补全而导入
const RoleLevel = {
    err: -1,
    member: 0,
    admin: 1,
    owner: 2
}
export interface BiteSetting {
    listenGroup: boolean|undefined,
    listenDiscuss: boolean|undefined,
    /**
     * 为true时会额外监听对应的at事件
     *
     * @type {(boolean|undefined)}
     * @memberof BiteSetting
     */
    listenAtEvent:boolean|undefined
    reply: {
        success: string//"嗷呜~",
        failPermitLevel: string//"咬..咬不到",
        failNotAdmin: string//"给我一个管理我就能咬到咯",
        failNoTarget: string//"要..要咬谁？",
        failTargetIsMyself: string//"休想！",
        failAnonymous: string//"懒得写匿名兼容了一律禁言嘻嘻"
    }
}
export class Bite {
    constructor(bot: CQWebSocket, setting: BiteSetting|undefined) {
        let sets = setting
        //检查
        if(!sets){sets={reply:Bite.initDefaultReply(),listenGroup:true,listenDiscuss:false,listenAtEvent:true}}
        if (sets.reply == undefined) sets.reply = Bite.initDefaultReply()
        if (sets.listenGroup == undefined && sets.listenDiscuss == undefined) sets.listenGroup = true
        this._setting = sets
        this._bot = bot
        if (sets.listenGroup) bot.on('message.group', this.listener.bind(this))
        if (sets.listenDiscuss) bot.on('message.discuss', this.listener.bind(this))
        if(sets.listenGroup && sets.listenAtEvent)bot.on('message.group.@.me',this.listener.bind(this))
        if(sets.listenDiscuss && sets.listenAtEvent)bot.on('message.discuss.@.me',this.listener.bind(this))
    }
    private _setting: BiteSetting
    private _bot: CQWebSocket
    off() {
        if (this._setting.listenGroup) this._bot.off('message.group', this.listener.bind(this))
        if (this._setting.listenDiscuss) this._bot.off('message.discuss', this.listener.bind(this))
    }
    async checkRoleLevel(group_id: number, user_id: number) {
        return await this._bot('get_group_member_info', {
            group_id: group_id,
            user_id: user_id,
            no_cache: true,
        }, {
            timeout: 10000 // 10 sec
        }).then((res) => {
            //console.log(res)
            //console.log("得到的角色是：" + res.data.role + "," + roleLevel[res.data.role])
            return RoleLevel[res.data.role]
            // {
            //   status: 'ok',
            //   retcode: 0,
            //   data: null
            // }
        }).catch((err) => {
            //console.error('請求超時!')
            return RoleLevel.err
        })
    }

    /**
     * 获取at的qq号
     * 
     * @param {*} msg context.raw_message
     * @returns {array} 第一个匹配项在数组[1](数组第二项)
     */
    getAt(msg) {
        const reg = /\[CQ:at,qq=([0-9]+)\]/;
        let result = reg.exec(msg);
        return result ? result : false;
    }

    
    /**
     * 去除CQ🐴
     *
     * @author KotoriK
     * @param {string} msg
     * @returns {string}
     * @memberof Bite
     */
    deCQ(msg: string):string {
        return msg.replace(/(\[CQ:[^\]]+\])/g, "")
    }
    /**
 * 回复消息
 * @author Tsuk1ko
 * @license GNU General Public License v3.0
 * @param {Record<string, any>} context 消息对象
 * @param {string} msg 回复内容
 * @param {boolean} at 是否at发送者
 */
    replyMsg(context: Record<string, any>, msg: string, at: boolean = false) {
        if (typeof msg != 'string' || msg.length == 0) return;
        if (context.group_id) {
            return this._bot('send_group_msg', {
                group_id: context.group_id,
                message: at ? Bite.newCQAt(context.user_id)
                    + msg : msg,
            });
        } else if (context.discuss_id) {
            return this._bot('send_discuss_msg', {
                discuss_id: context.discuss_id,
                message: at ? Bite.newCQAt(context.user_id)
                    + msg : msg,
            });
        } else if (context.user_id) {
            return this._bot('send_private_msg', {
                user_id: context.user_id,
                message: msg,
            });
        }
        return
    }
    listener(event: CQEvent, context: Record<string, any>, tags: CQTag[]): MessageListenerReturn {
       if (this.doBite(context)) event.stopPropagation() //要是接受了，就停止冒泡
    }
    /**
     * 咬人逻辑
     *
     * @author KotoriK
     * @param {Record<string, any>} context
     * @returns {boolean} 返回是否处理这个消息
     * @memberof Bite
     */
    doBite(context: Record<string, any>): boolean {
        if (context.message_type != "group" || context.message_type == "discuss") return false;
        let re = /^竹竹[^我他她它\s]+([我他她它])$/u.exec(this.deCQ(context.raw_message))
        if (!re) return false; //检查是否符合RegEx
        const myQQid = context.self_id
        //console.log("Confirm! ReadyToBite");
        let anonymous = context.anonymous,
            biteWho = re[1];
        if (anonymous) //检查是否是匿名消息
        {
            this._bot('set_group_anonymous_ban', {
                group_id: context.group_id,
                flag: anonymous.flag,
                duration: 10 * 60
            });
            if (biteWho == "我") {
                this.replyMsg(context, this._setting.reply.success, true);
            } else {
                this.replyMsg(context, this._setting.reply.failAnonymous, true);
            }
            return true;
        }
        let bite_user_id = context.user_id;//发起咬人的人的id
        if (biteWho != "我") {
            //咬别人    
            //检测有没有at
            //console.log(context.raw_message)
            //console.log(getAt(context.raw_message));
            bite_user_id = this.getAt(context.raw_message)[1];
            if (!bite_user_id) { //返回false 未获取到at qq号
                this.replyMsg(context, this._setting.reply.failNoTarget, true);
                return true;
            } else if (bite_user_id == myQQid) { //不准咬竹竹！
                this.replyMsg(context, this._setting.reply.failTargetIsMyself, true);
                return true;
            }

        }
        this.checkRoleLevel(context.group_id, myQQid).then(myRoleLevel => {
            //console.log(myRoleLevel)
            if (myRoleLevel > RoleLevel.member) { //检查我是否是管理员
                this.checkRoleLevel(context.group_id, bite_user_id).then(targetRoleLevel => {//检查目标是否可以咬
                    if (targetRoleLevel < myRoleLevel) {
                        //console.log("准备咬" + bite_user_id)
                        this._bot('set_group_ban', {
                            group_id: context.group_id,
                            user_id: bite_user_id,
                            duration: 60
                        });
                    } else {
                        this.replyMsg(context, this._setting.reply.failPermitLevel, true);
                        return
                    }
                    //reply success
                    this.replyMsg(context, this._setting.reply.success, true);
                    return 
                    //this.replyMsg(context, base64 ? CQcode.img64(base64) : CQcode.img(url))  //发图片
                })
            } else {
                //reply failure
                this.replyMsg(context, this._setting.reply.failNotAdmin, true);
                return 
            }
        })
        return true;
    }
    static newCQAt(user_id:number){
        return `[CQ:at,qq=${user_id}]`
    }
    static initDefaultReply(){return {
        success: "嗷呜~",
        failPermitLevel: "咬..咬不到",
        failNotAdmin: "给我一个管理我就能咬到咯",
        failNoTarget: "要..要咬谁？",
        failTargetIsMyself: "休想！",
        failAnonymous: "懒得写匿名兼容了一律禁言嘻嘻"
    } }
}