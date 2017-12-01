const router = require('koa-router')({prefix: '/api'})
const fetchVideoInfo = require('youtube-info')
const cheerio = require('cheerio')
const axios = require('axios')

router.get('/', async (ctx, next) => {
  ctx.body = await {
    'message': 'Successfully loaded api router'
  }
})

router.post('/request', async (ctx, next) => {
  console.log(ctx.request.body)
  const id = ctx.request.body.id.replace('https://www.youtube.com/watch?v=', '').replace('http://www.youtube.com/watch?v=', '').replace('https://youtu.be/', '')
  const youtubeInfo = await fetchVideoInfo(id)
  if(!youtubeInfo || !youtubeInfo.duration || parseInt(youtubeInfo.duration) > 600) {
    ctx.body = await {
      success: false
    }
    return
  }
  ctx.queue.put(youtubeInfo)
  if(ctx.queue.stack.length === 1 && ctx.currentSong == null) ctx.queue.get()  
  ctx.body = await {
    success: true,
    data: youtubeInfo
  }
})

router.post('/search', async (ctx, next) => {
  const kwd = ctx.request.body.keyword
  const search = await axios.get('https://youtube.com/results?search_query=' + encodeURI(kwd))
  if(search.status != 200) {
    ctx.body = await {
      success: false,
      error: search.data
    }
    return
  }
  const $ = cheerio.load(search.data)

  let items = $('div.yt-lockup.yt-lockup-tile.yt-lockup-video.vve-check.clearfix').filter((i, l) => $(this).find('.yt-uix-tile-link.yt-ui-ellipsis.yt-ui-ellipsis-2.yt-uix-sessionlink.spf-link').text() !== undefined).slice(0, 10)
  items = items.map((index, item) => {
    return ({
      title: $(item).find('.yt-uix-tile-link.yt-ui-ellipsis.yt-ui-ellipsis-2.yt-uix-sessionlink.spf-link').text(),
      url: 'https://www.youtube.com' + $(item).find('.yt-uix-tile-link.yt-ui-ellipsis.yt-ui-ellipsis-2.yt-uix-sessionlink.spf-link').attr('href'),
      artist: $(item).find('.yt-lockup-byline .yt-uix-sessionlink.spf-link').text().replace('\n  \n', '')
    })
  }).get()

  console.log(items)
  ctx.body = await {
    success: true,
    data: items
  }
})

router.post('/auth/login', async (ctx, next) => {

})

router.post('/auth/logout', async (ctx, next) => {

})
module.exports = router
