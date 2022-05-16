'use strict'
const WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({host:'0.0.0.0',port:process.env.ServerPort})

const redis = require('./RedisConfig')

let wordArr = ['Monkey', 'Dog', 'Bear', 'Flower', 'Girl','Boy','Cat','Bee','Phone','Mouse','Apple','Banane','Melon','Lemon']

let key = 'keyWord'
let roomInfo = {}

//生成答案
function getWord(arr){
    let num = Math.floor(Math.random()*arr.length)
    return arr[num]
}

//订阅某房间
function subChannel(room_id){
    if(roomInfo[room_id].isSub == false){
        redis.sub('channel_' + room_id)
        roomInfo[room_id].isSub = true
    }
}

//取消订阅某房间
function unSubChannel(room_id){
    if(roomInfo[room_id].isSub == true){
        redis.unSub('channel_' + room_id)
        roomInfo[room_id].isSub = false
    }
}

//向redis发布消息
function broadCastRedis(room_id, message){
    redis.pub('channel_' + room_id,message)
}

//向redis发布答案
function broadCastKeyWord(room_id, keyWord){
    redis.pub('channel_' + room_id,'keyword:' + keyWord)
}

//根据channel向对应玩家广播
function broadCastToPalyers(channel,message){
    let room_id = channel.substring(8)
    console.log("向room_ "+room_id+ "广播:" + message)
    if(room_id in roomInfo){
        for(let ws of roomInfo[room_id].players){
            if(ws.readyState == ws.OPEN){
                ws.send(message)
            }
        }
    }
}

function isZero(num){
    return (num == 0 || num == null || num == '0' || parseInt(num) == 0)
}

//人数为0时，删除房间
function deleteRoom(room_id){
    console.log("deleteRoom Start -------------------------- ")
    delete roomInfo[room_id]
    console.log("deleteRoom End -------------------------- ")
}

//删除对应ws的记录，之后不向其广播
function deleteWs(ws,room_id){
    console.log("deleteWs Start -------------------------- ")
    console.log("room_id:"+room_id)
    let ind = 0
    try {
        roomInfo[room_id].players.forEach((item, index, arr) => {
            if(item == ws){
                ind = index
            }
        })
        roomInfo[room_id].players.splice(ind,1)
        console.log("deleteWs end -------------------------- ")
    } catch (error) {
        throw new Error(err)
    }
}

//处理新进入的玩家
function handleNewPlayer(ws,room_id,isValid){
    console.log("handleNewPlayer Start -------------------------- ")
    if(room_id in roomInfo ){
        roomInfo[room_id].players.push(ws)
    } else {
        roomInfo[room_id] = {}
        roomInfo[room_id].players = new Array()
        roomInfo[room_id].players.push(ws)
        roomInfo[room_id].isSub = false
    }
    console.log("room list:"+Object.keys(roomInfo))

    if(!isValid){
        redis.incValue(room_id).then(res => {
            console.log(room_id +"非法加入，将会退出")
        }).catch(err => { throw new Error(err)}).finally(res => {
            return
        })
        return
    }

    redis.getValue(room_id).then(res => {
        console.log(room_id + "加入前玩家数目："+res)
        //新房间，需要生成答案
        if(isZero(res)){
            let keyWord = getWord(wordArr)
            roomInfo[room_id].keyWord = keyWord
            redis.setValue(room_id+'_'+key,keyWord)
            subChannel(room_id)
            redis.incValue(room_id).then(res => {
                console.log(room_id +"加入后玩家数目："+res)
            }).catch(err => { throw new Error(err)})
            //broadCastKeyWord(room_id,keyWord)
            ws.send('keyword:' + keyWord)
        }else if((res > 0 || parseInt(res) > 0) && (res < 200 || parseInt(res) < 200)){ //已有房间，需要获取答案
            redis.getValue(room_id+'_'+key).then(res => {
                let keyWord = res
                roomInfo[room_id].keyWord = keyWord
                subChannel(room_id)
                redis.incValue(room_id).then(res => {
                    console.log(room_id+"加入后玩家数目："+res)
                }).catch(err => { throw new Error(err)})

                //broadCastKeyWord(room_id,keyWord)
                ws.send('keyword:' + keyWord)
            }).catch(err => { throw new Error(err)})
        }else if(res >= 200 || parseInt(res) >= 200) {
            ws.send("满员了")
        }else {
            ws.close()
        }
    }).catch(err => { throw new Error(err)})
    console.log("handleNewPlayer end -------------------------- ")
}

//处理新加入的绘画者
function handleNewDrawer(ws,room_id) {
    console.log("handleNewDrawer Start -------------------------- ")
    redis.getValue(room_id + '_draw').then(res => {
        console.log(res)
        //没有绘画者，合法
        if(isZero(res)){
            redis.setValue(room_id + '_draw','1')
            handleNewPlayer(ws,room_id,true)
            ws.on('close',function(ws,code,buffer){drawerClose(ws,code,buffer,room_id)})
        }else {  //已经有绘画者了，此绘画者非法
            handleNewPlayer(ws,room_id,false)
            ws.send('hasDrawer')
            ws.on('close',function(ws,code,buffer){showerClose(ws,code,buffer,room_id)})
        }
    }).catch(err => { throw new Error(err)})
    console.log("handleNewDrawer End -------------------------- ")
}

//处理新加入的猜测者
function handleNewshower(ws,room_id) {
    console.log("handleNewshower Start -------------------------- ")
    handleNewPlayer(ws,room_id,true)
    ws.on('close',function(ws,code,buffer){showerClose(ws,code,buffer,room_id)})
    console.log("handleNewshower End -------------------------- ")
}

//绘画者退出
function drawerClose(ws,code,buffer,room_id){
    console.log("画者关闭页面  Stard--------------")
    console.log('room_id:' + room_id)
    deleteWs(ws,room_id)
    redis.setValue(room_id + '_draw','0')
    redis.decValue(room_id).then(res => {
        console.log("目前剩余玩家：%d",res)
        if(res <= 0){
            unSubChannel(room_id)
            deleteRoom(room_id)
        }
        if(res < 0){
            redis.setValue(room_id ,'0')
        }
    }).catch(err => {
        throw new Error(err)
    })
    console.log("画者关闭页面  End--------------")
}


//猜测者退出
function showerClose(ws,code,buffer,room_id){
    console.log("猜者关闭页面  Stard--------------")
    console.log('room_id:' + room_id)
    deleteWs(ws,room_id)
    redis.decValue(room_id).then(res => {
        console.log("目前剩余玩家：%d",res)
        if(res <= 0){
            unSubChannel(room_id)
            deleteRoom(room_id)
            redis.setValue(room_id + '_draw','0')
        }
        if(res < 0){
            redis.setValue(room_id ,'0')
        }
    }).catch(err => {
        throw new Error(err)
    })
    console.log("猜者关闭页面  End--------------")
}

//redis接收到订阅的信息
function subscriber(){
    redis.subscriber.on('message', (channel, message) => {
        console.log('Message # Channel ' + channel + ': ' + message)
        broadCastToPalyers(channel,message)
    });
}

async function main() {

    subscriber()

	wss.on('connection', function connection(ws) {
        console.log('connected.')

        //记录当前ws对应的room_id
        let room_id 

        //处理收到的消息
        ws.on('message', function(message) {
            console.log('received: %s', message)
            let msg = message.toString()
            if (msg.substring(0,12)=="draw_room_id"){
                room_id = msg.substring(13)
                handleNewDrawer(this, room_id)
            }else if (msg.substring(0,12)=="show_room_id"){
                room_id = msg.substring(13)
                handleNewshower(this, room_id)
            }else if (message == roomInfo[room_id].keyWord) {
                console.log('correct')
                ws.send('答对了！！')
            } else {
                console.log(room_id+'房间发来消息：' + message)
                broadCastRedis(room_id,message)
            }
        })

        //打印连接错误信息
        ws.on('error',function(err) {
            console.log('房间：'+ room_id +' ws连接出现错误')
            console.log('err name：'+ err.name)
            console.log('err message：'+ err.message)
            throw new Error(err)
        })
    })
};

main()