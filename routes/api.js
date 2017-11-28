const router = require('koa-router')({prefix: '/api'})
const fetchVideoInfo = require('youtube-info')

router.get('/', async (ctx, next) => {
  ctx.body = await {
    'message': 'Successfully loaded api router'
  }
})

router.post('/request', async (ctx, next) => {
  const id = ctx.request.body.id.replace('https://www.youtube.com/watch?v=', '').replace('http://www.youtube.com/watch?v=', '').replace('https://youtu.be/', '')
  const youtubeInfo = await fetchVideoInfo(id)
    /* 예시
    {
    videoId: '{video Id}',
    url: '{video url}',
    title: '{video title}',
    description: '{video description as HTML}',
    owner: '{video owner}',
    channelId: '{owner channel id}',
    thumbnailUrl: '{video thumbnail url}',
    embedURL: '{video embed url}',
    datePublished: '{video publication date}',
    genre: '{video genre}',
    paid: {true/false},
    unlisted: {true/false},
    isFamilyFriendly: {true/false},
    duration: {video duration in seconds},
    views: {number of views},
    regionsAllowed: [ '{two letter country code}', ... ],
    commentCount: {number of comments}
    }
    */
  
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

router.post('/auth/login', async (ctx, next) => {

})

router.post('/auth/logout', async (ctx, next) => {

})
module.exports = router
