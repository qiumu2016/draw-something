<template>
    <canvas id="canvas" width="520" height="350" style="border: 1px solid #999;"></canvas>
    <div id="keyword-box">
        <span>Keyword: </span>
        <span id="keyword"></span>
    </div>
    <button id="btn">清空画布</button>
</template>

<script>

'use strict'
import remote from './env.js'

class Draw {
    constructor(el) {
        this.el = el
        this.canvas = document.getElementById(this.el)
        this.cxt = this.canvas.getContext('2d')
        this.stage_info = canvas.getBoundingClientRect()
        this.path = {
            beginX: 0,
            beginY: 0,
            endX: 0,
            endY: 0
        }
    }

    init(ws, btn) {
        this.canvas.onmousedown = () => {
            this.drawBegin(event, ws)
        }
        this.canvas.onmouseup = () => {
            this.drawEnd()
            ws.send('stop')
        }
        this.clearCanvas(ws, btn)
    }
    drawBegin(e, ws) {
        window.getSelection() ? window.getSelection().removeAllRanges() : document.selection.empty()
        this.cxt.strokeStyle = "#000"

        this.cxt.beginPath()
        this.cxt.moveTo(
            e.clientX - this.stage_info.left,
            e.clientY - this.stage_info.top
        )

        this.path.beginX = e.clientX - this.stage_info.left
        this.path.beginY = e.clientY - this.stage_info.top

        document.onmousemove = () => {
            this.drawing(event, ws)
        }
        // document.onmouseup = this.drawEnd
    }
    drawing(e, ws) {
        this.cxt.lineTo(
            e.clientX - this.stage_info.left,
            e.clientY - this.stage_info.top
        )

        this.path.endX = e.clientX - this.stage_info.left
        this.path.endY = e.clientY - this.stage_info.top

        ws.send(this.path.beginX + '.' + this.path.beginY + '.' + this.path.endX + '.' + this.path.endY)

        this.cxt.stroke()
    }
    drawEnd() {
        document.onmousemove = document.onmouseup = null
    }
    clearCanvas(ws, btn) {
        btn.onclick = () => {
            this.cxt.clearRect(0, 0, 500, 500)
            ws.send('clear')
        }
    }
}

export default {
    ready() {
        let local =   'ws://localhost:8091'
        let origin = remote.remote
        let url = "ws://" + origin.substring(origin.lastIndexOf('/'))
        console.log('ws:' + url)
        const ws = new WebSocket(url);
        let draw = new Draw('canvas')
        let btn = document.getElementById('btn')
        ws.onopen = () => {
            ws.send("room_id:" + this.$parent.room_id)
            draw.init(ws, btn)
        }
        ws.onmessage = (msg) => {
            msg.data.split(':')[0] == 'keyword' ?
                document.getElementById('keyword').innerHTML = msg.data.split(':')[1] :
                false
        }
    }
}
</script>

<style lang="less">
    #canvas {
        background: pink;
        cursor: default;
    }
    #keyword-box {
        margin: 10px 0;
    }
</style>