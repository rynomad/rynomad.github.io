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
  window.addEventListener('status', ({detail}) => {
    const msg = document.createElement('p')
    msg.innerText = detail
    const status = document.getElementById('status')
    status.appendChild(msg)
    if (status.childElementCount > 10){
      
      status.firstChild.remove();
    }
  })
  window.dispatchEvent(new CustomEvent('status', {detail : 'starting'}))
  document.getElementById('localVideo').srcObject = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  window.dispatchEvent(new CustomEvent('status', {detail : 'got video'}))

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
  window.dispatchEvent(new CustomEvent('status', {detail : 'client initialized'}))
  window.client = client
  const callables = new Set()
  client.on('callable', () => {
    for (const service of client.callServices){
      callables.add(JSON.stringify(service))
    }
    const container = document.getElementById('callbuttons')
    while (container.firstChild) {
      container.firstChild.remove();
    }
    Array.from(callables).map(str => JSON.parse(str)).forEach(({seller}) => {
      const el = document.createElement('input')
      el.setAttribute('type','button')
      el.setAttribute('value', seller)
      el.onclick = async () => {
        const call = await client.call(seller)

        window.dispatchEvent(new CustomEvent('status', {detail : 'calling'}))
        call.on('start', () => {
          window.dispatchEvent(new CustomEvent('status', {detail : 'call started'}))
          console.log("call start event")
          window.dispatchEvent(new CustomEvent('call',{detail : client}))
        })
      }
      container.appendChild(el)
    })
  })

  client.start()
  return
}