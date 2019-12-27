//bite.js
export default doBite
import config from '../config';
/**
 * reply:{
 * success:"嗷呜~",
 * failPermitLevel:"咬..咬不到",
 * failNotAdmin:"给我一个管理我就能咬到咯",
 * failNoTarget:"要..要咬谁？",
 * failTargetIsMyself:"休想！",
 * failAnonymous:"懒得写匿名兼容了一律禁言嘻嘻"
 * }
 */
const setting = config.bite
const roleLevel = {
    err: -1,
    member: 0,
    admin: 1,
    owner: 2
};
let pics = [];
let theBot;
/**
 *
 *
 * @param {Object} context 消息对象
 * @param {function} replyFunc 回复的回调函数
 * @param {Object} bot 
 * @returns {boolean},passthrough:false,handled:true
 */
function doBite(context, replyFunc, bot) {
    //console.log("doBite!")
    //console.log(context)
    if(context.message_type!="group")return;
    let re = /^竹竹[^我他她它\s]+([我他她它])$/u.exec(deCQ(context.raw_message))
    if (!re) return false; //检查是否符合RegEx
    const myQQid=context.self_id
    theBot = bot;
    new Promise(function () {
        //console.log("Confirm! ReadyToBite");
        let anonymous = context.anonymous,
            biteWho = re[1];
        if (anonymous) //检查是否是匿名消息
        {
            theBot('set_group_anonymous_ban', {
                group_id: context.group_id,
                flag: anonymous.flag,
                duration: 10 * 60
            });
            if (biteWho == "我") {
                replyFunc(context, setting.reply.success, true);
            } else {
                replyFunc(context, setting.reply.failAnonymous, true);
            }
            return true;
        }
        let bite_user_id = context.user_id;
        if (biteWho != "我") { //咬别人    
            //检测有没有at
            //console.log(context.raw_message)
            //console.log(getAt(context.raw_message));
            bite_user_id = getAt(context.raw_message)[1];
            if (!bite_user_id) { //返回false 未获取到at qq号
                replyFunc(context, setting.reply.failNoTarget, true);
                return true;
            } else {
                if (bite_user_id == myQQid) { //不准咬竹竹！
                    replyFunc(context, setting.reply.failTargetIsMyself, true);
                    return true;
                }
            }
        }
        checkRoleLevel(context.group_id, myQQid).then(myRoleLevel => {
            //console.log(myRoleLevel)
            if (myRoleLevel > roleLevel.member) { //检查我是否是管理员
                checkRoleLevel(context.group_id, bite_user_id).then(targetRoleLevel => {//检查目标是否可以咬
                    if (targetRoleLevel < myRoleLevel) {
                        //console.log("准备咬" + bite_user_id)
                        theBot('set_group_ban', {
                            group_id: context.group_id,
                            user_id: bite_user_id,
                            duration: 60
                        });
                    } else {
                        replyFunc(context, setting.reply.failPermitLevel, true);
                        return true;
                    }
                    //reply success
                    replyFunc(context, setting.reply.success, true);
                    return true;
                    //replyFunc(context, base64 ? CQcode.img64(base64) : CQcode.img(url))  //发图片
                })
            } else {
                //reply failure
                replyFunc(context, setting.reply.failNotAdmin, true);
                return true;

            }
        })

    })
    return true;
}



async function checkRoleLevel(group_id, user_id) {
    var result = await theBot('get_group_member_info', {
            group_id: group_id,
            user_id: user_id,
            no_cache: true,
        }, {
            timeout: 10000 // 10 sec
        }).then((res) => {
            //console.log(res)
            //console.log("得到的角色是：" + res.data.role + "," + roleLevel[res.data.role])
            return roleLevel[res.data.role]
            // {
            //   status: 'ok',
            //   retcode: 0,
            //   data: null
            // }
        })
        .catch((err) => {
            //console.error('請求超時!')
            return roleLevel.err
        })
    return result
}

/**
 * 获取at的qq号
 * 
 * @param {*} msg context.raw_message
 * @returns {array} 第一个匹配项在数组[1](数组第二项)
 */
function getAt(msg) {
    const reg = /\[CQ:at,qq=([0-9]+)\]/;
    let result = reg.exec(msg);
    return result ? result : false;
}

function deCQ(msg) {
    return msg.replace(/(\[CQ:[\S]+\] )+/g, "")
}
/////