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
    console.log("broadCastToPalyers Start -------------------------- ")
    let room_id = channel.substring(8)
    console.log("向room_ "+room_id+ "广播:" + message)
    console.log("room list:"+Object.keys(roomInfo))
    if(room_id in roomInfo){
        for(let ws of roomInfo[room_id].players){
            ws.send(message)
        }
    }
    console.log("broadCastToPalyers End -------------------------- ")
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
    roomInfo[room_id].players.forEach((item, index, arr) => {
        if(item == ws){
            ind = index
        }
    })
    roomInfo[room_id].players.splice(ind,1)
    console.log("deleteWs end -------------------------- ")
}

//处理新进入的玩家
function handleNewPlayer(ws,room_id){
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

    redis.getValue(room_id).then(res => {
        console.log(room_id + "加入前玩家数目："+res)
        //新房间，需要生成答案
        if(res == 0 || res == null || res == '0'){
            let keyWord = getWord(wordArr)
            roomInfo[room_id].keyWord = keyWord
            redis.setValue(room_id+'_'+key,keyWord)
            subChannel(room_id)
            redis.incValue(room_id).then(res => {
                console.log(room_id +"加入后玩家数目："+res)
            }).catch(err => { throw new Error(err)})

            broadCastKeyWord(room_id,keyWord)
        }else { //已有房间，需要获取答案
            redis.getValue(room_id+'_'+key).then(res => {
                let keyWord = res
                roomInfo[room_id].keyWord = keyWord
                subChannel(room_id)
                redis.incValue(room_id).then(res => {
                    console.log(room_id+"加入后玩家数目："+res)
                }).catch(err => { throw new Error(err)})

                broadCastKeyWord(room_id,keyWord)
            }).catch(err => { throw new Error(err)})
        }
    }).catch(err => { throw new Error(err)})
    console.log("handleNewPlayer end -------------------------- ")
}

async function main() {

	wss.on('connection', function connection(ws) {
        console.log('connected.')
        let room_id //记录当前ws对应的room_id

        redis.subscriber.on('message', (channel, message) => {
            console.log('Message # Channel ' + channel + ': ' + message)
            broadCastToPalyers(channel,message)
        });
    
        //处理收到的消息
        ws.on('message', function(message) {
            console.log('received: %s', message)
            let msg = message.toString()
            if (msg.substring(0,7)=="room_id"){
                room_id = msg.substring(8)
                handleNewPlayer(this, room_id)
            }else if (message == roomInfo[room_id].keyWord) {
                console.log('correct')
                ws.send('答对了！！')
            } else {
                console.log(room_id+'房间发来消息：' + message)
                broadCastRedis(room_id,message)
            }
        })

        //关闭连接时，对房间信息进行更新
        ws.on('close',function(ws,code,buffer){
            console.log("玩家关闭页面  Stard--------------")
            console.log('room_id:' + room_id)
            deleteWs(ws,room_id)
            redis.decValue(room_id).then(res => {
                console.log("目前剩余玩家：%d",res)
                if(res == 0){
                    unSubChannel(room_id)
                    deleteRoom(room_id)
                }
            }).catch(err => {
                throw new Error(err)
            })
            console.log("玩家关闭页面  End--------------")
        })
    })

    
};

main()