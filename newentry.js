var localVideo;
var localStream;
var remoteVideo;
var peerConnection;
var uuid;
var serverConnection;

const SturnClient = require('turnadmin/sturn_client.js')

window.peerConnectionConfig = {
  'iceServers': []
};

/*
    {
      'urls': 'turn:stuntest.com:3478',

    },
*/
window.pageReady = async function pageReady() {
  const client = new SturnClient({
    localVideo : 'localVideo',
    remoteVideo : 'remoteVideo',
    ringer : (user) => {
      alert('you are being called by ' + user)
      return true
    },
    steempay : {
      sc2: {
        app: 'sturn.app',
        callbackURL: 'https://rynomad.github.io',
        scope: [
          'vote',
          'comment',
          'custom_json'
        ]
      }
    }
  })

  await client.init()
  client.start()
  if (client.bot.username === 'steempaytestfive'){
    const call = client.call('rynomad')
    call.on('start', () => {
      console.log("got call start event")
      var event = new CustomEvent('call', { detail: client });
      console.log("dispatching")
      window.dispatchEvent(event)
    })
  } else {
    await client.getCredential()
  }
  return
}