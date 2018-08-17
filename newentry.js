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
        callbackURL: 'http://localhost:4000',
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
    client.call('rynomad')
  } else {
    await client.getCredential()
  }
  return
/*
  // acquire access_token and username after authorization
  let access_token = new URLSearchParams(document.location.search).get(
    'access_token'
  );
  let username = new URLSearchParams(document.location.search).get('username');
  const client = new SteemPayClient({
    username,
    sc2: {
      app: 'sturn.app',
      access_token,
      callbackURL: 'http://localhost:4000',
      scope: [
        'vote',
        'comment',
        'custom_json'
      ]
    }
  })

  if (access_token) {
    client._api.setAccessToken(access_token)
    await client.init()
    const order = await client.placeOrder({
      seller : 'rynomad',
      service_permlink : 'steempay-service-sturn'
    })

    const delivery = await client.receiveDelivery({seller : 'rynomad', order})
    const iceServer = JSON.parse(delivery.body)
    peerConnectionConfig.iceServers.push(iceServer)
  } else {
    // Login button

    const link = document.createElement('a')
    link.setAttribute('href', client._api.getLoginURL())
    link.innerText = ('Log In')
    document.body.appendChild(link)
    return
  }

  uuid = createUUID();

  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');

  serverConnection = new WebSocket('ws://' + window.location.hostname + ':4000');
  serverConnection.onmessage = gotMessageFromServer;

  var constraints = {
    video: true,
    audio: true,
  };

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
  } else {
    alert('Your browser does not support getUserMedia API');
  }
  */
}

function getUserMediaSuccess(stream) {
  localStream = stream;
  localVideo.srcObject = stream;
}

window.start = function start(isCaller) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.ontrack = gotRemoteStream;
  peerConnection.addStream(localStream);

  if (isCaller) {
    peerConnection.createOffer().then(createdDescription).catch(errorHandler);
  }
}

function gotMessageFromServer(message) {
  if (!peerConnection) start(false);

  var signal = JSON.parse(message.data);

  // Ignore messages from ourself
  if (signal.uuid == uuid) return;

  if (signal.sdp) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        console.log('got offer')
        peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if (signal.ice) {
    const candidate = new RTCIceCandidate(signal.ice)
    console.log(candidate)
    if (candidate.type === 'relay') {
      console.log("got ice candidate", signal.ice)
      peerConnection.addIceCandidate(candidate).catch(errorHandler);

    }
  }
}

function gotIceCandidate(event) {
  if (event.candidate != null) {
    serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function () {
    console.log("set description")
    serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  remoteVideo.srcObject = event.streams[0];
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
