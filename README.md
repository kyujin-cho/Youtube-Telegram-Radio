YoutubeRadio

- How-to
1. make config.js file, which contains sensitive and personal information needed to your music station.
Your config.js should look like this:
```
module.exports = {
  base_url: 'URL', // Base URL, where your server will be run.
  port: '3000', // HTTP Port
  ws_port: '12345', // WebSocket Port
  bot_token: 'YOUR:BOT_TOKEN' // Telegram Bot Token
}
```
2. Save config.js
3. `npm install`
4. `npm install -g webpack`
4. `webpack`
5. `npm start`
6. Done!