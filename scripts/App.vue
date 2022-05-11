<template>

<div class = "main">
  <div   v-if='this.player != 0' style="margin_left:" class="text">  房间号: {{room_id}}</div><br>
  <drawing-board v-if='this.player == 1'></drawing-board>
  <showing-board v-if='this.player == 2'></showing-board>
  <div   v-if='this.player == 0' class="text"> 请输入房间号:</div><br>
  <input  v-if='this.player == 0' type="text" placeholder="房间号默认为0" name="room_id" v-model="room_id">
  <div class="btns">
  <button v-if='this.player == 0' @click='draw' class="button">我来画</button>
  <button v-if='this.player == 0' @click='guess' class="button">我来猜</button>
  <button v-if='this.player == 2' @click='replay' class="button">重新开始</button>
  </div>
  </div>
</template>

<script>
import Vue from 'vue'

import DrawingBoard from './components/drawing-board.vue'
import showingBoard from './components/showing-board.vue'

export default {
    data() {
      return {
        room_id:0,
        player: 0
      }
    },
    components: {
      DrawingBoard,
      showingBoard
    },
    methods: {
      draw() {
        this.player = 1
      },
      guess() {
        this.player = 2
      },
      replay() {
        this.player = 0
        location.reload()
      }
    }
}
</script>

<style lang="less">
body {
  background: #fff;
}
.main{
  text-align:center;
}
.text {
  display:block;
  width: 520;
}
.btns {
  display:block;
  width: 520;
}
.button {
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 10px 10px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
}
</style>
