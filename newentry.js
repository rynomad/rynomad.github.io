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
  window.client = client
  client.on('callable', () => {
    console.log("got callables", client.callServices)
    const container = document.getElementById('callbuttons')
    while (container.firstChild) {
      container.firstChild.remove();
    }
    client.callServices.forEach(({seller}) => {
      const el = document.createElement('input')
      el.setAttribute('type','button')
      el.setAttribute('value', seller)
      el.onclick = () => {
        client.call(seller)
      }
      container.appendChild(el)
    })
  })

  client.start()
  return
}