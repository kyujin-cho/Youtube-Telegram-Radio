const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/login', async (ctx, next) => {
  await ctx.render('login')
})

module.exports = router
