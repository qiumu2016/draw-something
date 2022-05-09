'use strict'
const WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({host:'0.0.0.0',port: 8091})

const redis = require('./RedisConfig')

let wordArr = ['Monkey', 'Dog', 'Bear', 'Flower', 'Girl','Boy','Cat','Bee','Phone','Mouse','Apple','Banane','Melon','Lemon']

let key = 'drawDemo'
let channel = "drawChannel"
let playerNum = 'playerNum'
let keyWord = ''
let isSub = false

function getWord(arr){
    let num = Math.floor(Math.random()*arr.length)
    return arr[num]
}

function printNow(){
    console.log('当前信息：')
    console.log('keyWord:' + keyWord)
}

function subChannel(){
    if(!isSub){
        redis.sub(channel)
        isSub = true
    }
}

async function main() {
	wss.on('connection', function(ws) {
        console.log('connected.')
        printNow()
        redis.getValue(playerNum).then(res => {
            console.log("加入前玩家数目："+res)
            if(res == 0 || res == null || res == '0'){
                keyWord = getWord(wordArr)
                redis.setValue(key,keyWord)
                subChannel()
                redis.incValue(playerNum).then(res => {
                    console.log("加入后玩家数目："+res)
                }).catch(err => { throw new Error(err)})
                wss.clients.forEach((client) => {
                    client.send('keyword:' + keyWord)
                })
            }else {
                redis.getValue(key).then(res => {
                    keyWord = res
                    subChannel()
                    redis.incValue(playerNum).then(res => {
                        console.log("加入后玩家数目："+res)
                    }).catch(err => { throw new Error(err)})
                    wss.clients.forEach((client) => {
                        client.send('keyword:' + keyWord)
                    })
                }).catch(err => { throw new Error(err)})
            }
        }).catch(err => { throw new Error(err)})

        redis.subscriber.on('message', (channel, message) => {
            console.log('Message # Channel ' + channel + ': ' + message);
            wss.clients.forEach((client) => {
                client.send(message)
            })
        });
    
        ws.on('close',function(ws,code,buffer){
            console.log("玩家关闭页面")
            redis.decValue(playerNum).then(res => {
                console.log("目前剩余玩家：%d",res)
                if(res == 0){
                    redis.unSub(channel)
                }
            }).catch(err => {
                throw new Error(err)
            })
        })

    
        ws.on('message', function(message) {
            console.log('received: %s', message)
            if (message == keyWord) {
                console.log('correct')
                // wss.clients.forEach((client) => {
                //     client.send('答对了！！')
                // })
                ws.send('答对了！！')
            } else {
                console.log('wrong')
                redis.pub(channel,message)
                // wss.clients.forEach((client) => {
                //     client.send(message)
                // })
            }
        })

        
        // wss.clients.forEach((client) => {
        //     client.send('keyword:' + keyWord)
        // })
    })

    
};

main()
// async function test(){
//     redis.setValue(key, "1")
//     let num = await redis.getValueAsync(key)
//     let data = num
//     console.log(data == null )
//     console.log(data == 1)
//     console.log('redis: %s', data)
// }


