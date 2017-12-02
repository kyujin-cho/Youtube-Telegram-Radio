const timers = require('timers')
const setTimeout = timers.setTimeout

const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')

const session = require('koa-session')
const passport = require('koa-passport')

const index = require('./routes/index')
const api = require('./routes/api')
const config = require('./config')


// error handler
onerror(app)

class EventedArray {
  constructor() {
    this.stack = []
    this.putHandler = function (a) { }
    this.getHandler = function (a) { }
    this.setPutHandler = function (f) {
      this.putHandler = f
    }
    this.setGetHandler = function (f) {
      this.getHandler = f
    }
    
    this.callHandler = function (type, data) {
      const handler = (type == 'put') ? this.putHandler : this.getHandler
      console.log(type + ' handler called')
      if (typeof handler === 'function') {
        handler(data)
      }
    }
    this.put = function(data) {
      this.stack.push(data)
      this.callHandler('put', data)
    }
    this.get = function() {
      this.callHandler('get', this.stack[0])
      return this.stack.shift()
    }
    this.getArray = function () {
      return this.stack
    }
  }
}

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(api.routes(), api.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

app.keys = ['secret']
app.use(session({}, app))

app.use(passport.initialize())
app.use(passport.session())
 
const server = require('http').Server(app.callback()),
  io = require('socket.io')(server)

const queue = new EventedArray()
let startTime = -1
app.context.currentSong = null

queue.setPutHandler((data) => {
  io.emit('newSong', data)
})

queue.setGetHandler((data) => {
  console.log(data.duration)
  setTimeout(() => {
    console.log('Timeout called')
    if(queue.stack.length != 0)
      queue.get()
    else {
      app.context.currentSong = null
      startTime = -1
    }
  }, parseInt(data.duration) * 1000)
  startTime = new Date().getTime()
  app.context.currentSong = data
})

app.context.queue = queue
io.on('connection', socket => {
  socket.on('newListener', () => {
    console.log(app.context.currentSong)
    if(app.context.currentSong)
      socket.emit('currentSong', {
        currentId: app.context.currentSong.videoId,
        title: app.context.currentSong.title,
        currentTime: ((new Date()).getTime() - startTime)/ 1000
      })
    else
      socket.emit('currentSong', {
        currentId: 'none'
      })
    socket.emit('queue', app.context.queue.stack)
    console.log('Got new listener')
  })
})

server.listen(config.ws_port)

const token = config.bot_token

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true})

// Matches "/echo [whatever]"
bot.onText(/\/request (.+)/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id
  const youtubeId = match[1] // the captured "whatever"
  
  const res = await axios.post('http://' + config.base_url + ':' + config.port + '/api/request', {id: youtubeId})
  if(res.data.success)
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, res.data.data.title + ' 영상이 큐에 추가되었습니다.')
  else
    bot.sendMessage(chatId, '오류가 발생하였습니다. Error: ' + res.data.error)
})


module.exports = app
