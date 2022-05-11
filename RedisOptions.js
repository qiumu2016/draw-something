const options = {
    host: process.env.RedisHost,
    port: process.env.RedisPort,
    detect_buffers: true // 传入buffer 返回也是buffer 否则会转换成String
  }
   
  module.exports = options
   
