import React from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import io from 'socket.io-client'
import Youtube from 'react-youtube'
import config from '../config'

const socket = io.connect(config.base_url + ':' + config.ws_port)

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {isEnded: false, startTime: -1, videoId: 'none', title: 'none', queue: [], requestId: ''}
  }

  addToQueue(songInfo) {
    console.log('Got new song')
    console.log(songInfo.videoId)
    this.setState({
      queue: this.state.queue.concat(songInfo)
    })
    if(this.state.isEnded) {
      this.playSong()
    }
  }

  onEnd(event) {
    if(this.state.queue.length == 0)
      this.setState({isEnded: true})
    else this.playSong()
  }

  playSong() {
    const video = this.state.queue[0]
    this.setState({
      queue: this.state.queue.slice(1),
      startTime: 0,
      videoId: video.videoId,
      title: video.title,
      isEnded: false
    })
  }

  getIntoCurrentSong(songInfo) {
    console.log('Current playing song')
    console.log(songInfo.currentId)
    if(songInfo.currentId === 'none') 
      this.setState({
        videoId: 'none',
        startTime: 'none',
        isEnded: true
      })
    else
      this.setState({
        videoId: songInfo.currentId,
        startTime: songInfo.currentTime,
        title: songInfo.title
      })
  }

  onRequestIdChange(event) {
    this.setState({
      requestId: event.target.value
    })
  }

  async requestSong(event) {
    const response = await axios.post('http://' + config.base_url + ':' + config.port + '/api/request', {id: this.state.requestId})
    if(response.data.success)
      alert('Requested!')
    else
      alert('Error!')
  }

  componentDidMount() {
    socket.on('currentSong', (songInfo) => this.getIntoCurrentSong(songInfo))
    socket.on('queue', (songs) => songs.forEach((song) => this.addToQueue(song)))
    socket.on('newSong', (songInfo) => this.addToQueue(songInfo))

    socket.emit('newListener')
  }

  tryLogin(event) {

  }

  render() {
    return (
      <div>
        <button onClick={this.tryLogin.bind(this)}>Login</button>
        <div id="title"> Current Song: {this.state.title} </div>
        <YoutubePlayer startTime={this.state.startTime} videoId={this.state.videoId} onEnd={this.onEnd.bind(this)} />
        <div id="request">
          <input type="text" onChange={this.onRequestIdChange.bind(this)} />
          <button onClick={this.requestSong.bind(this)}>Request</button>
        </div>
        <div id="queue">
          <Queue queue={this.state.queue} />
        </div>
      </div>
    )
  }
}

class YoutubePlayer extends React.Component {
  onStateChange(event) {
    event.target.playVideo()
  }
  render() {   
    return (
      <div id="youtube">
        <Youtube
          id="player"
          videoId={this.props.videoId}
          opts={{
            width: 640,
            height: 360,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              iv_load_policy: 3,
              showinfo: 0,
              start: this.props.startTime
            },
          }}
          onEnd={this.props.onEnd}
          onStateChange={this.onStateChange.bind(this)}
        />
      </div>
    )
  }
}

class Queue extends React.Component {
  render() {
    let Queue = <div>No song in queue</div>
    if(this.props.queue) {
      Queue = this.props.queue.map((song, index) => {
        return <Song song={song} key={index} index={index}/>
      })
    }
    return (
      <div id="queue">
        {Queue}
      </div>
    )
  }
}

class Song extends React.Component {
  render() {
    return (
      <div className="song">
        {this.props.index + 1}. {this.props.song.title}
      </div>
    )
  }
}
ReactDOM.render(<App />, document.getElementById('container'))