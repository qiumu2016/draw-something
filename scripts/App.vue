<template>
  <drawing-board v-if='this.player == 1'></drawing-board>
  <showing-board v-if='this.player == 2'></showing-board>
  <span   v-if='this.player == 0'> 请输入房间号:</span><br>
  <input  v-if='this.player == 0' type="text" placeholder="房间号默认为0" name="room_id" v-model="room_id"><br>
  <button v-if='this.player == 0' @click='draw'>我来画</button>
  <button v-if='this.player == 0' @click='guess'>我来猜</button>
  <button v-if='this.player == 2' @click='replay'>重新开始</button>
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
</style>
