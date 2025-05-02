import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';

function App() {
  const [ws, setWs] = createSignal<WebSocket | null>(null);
  const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = createSignal<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = createSignal<{ type: string; payload: any } | null>(null); // { type: 'offer', sdp: '...' }
  const [remoteVideo, setRemoteVideo] = createSignal<HTMLVideoElement | null>(null);
  const [localVideo, setLocalVideo] = createSignal<HTMLVideoElement | null>(null);

  // WebSocket接続
  const connectWebSocket = () => {
    const websocket = new WebSocket('wss://ulg.local:8443/ws'); // シグナリングサーバーのアドレスに合わせて変更

    websocket.onopen = () => {
      console.log('WebSocket Connected');
      setWs(websocket);
    };

    websocket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      if (message.type === 'offer') {
        // 着信通知を表示
        setIncomingCall(message);
      } else if (message.type === 'answer') {
        // Answer SDPを受信
        if (peerConnection()) {
          await peerConnection()!.setRemoteDescription(new RTCSessionDescription(message.payload));
        }
      } else if (message.type === 'candidate') {
        // ICE Candidateを受信
        if (peerConnection() && message.payload) {
          try {
            await peerConnection()!.addIceCandidate(message.payload);
          } catch (e) {
            console.error('Error adding received ICE candidate', e);
          }
        }
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket Disconnected');
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    onCleanup(() => {
      websocket.close();
    });
  };

  // RTCPeerConnectionのセットアップ
  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUNサーバー
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && ws()) {
        // ICE Candidateをシグナリングサーバーに送信
        ws()!.send(JSON.stringify({ type: 'candidate', payload: event.candidate }));
      }
    };

    pc.ontrack = (event) => {
      // リモートストリームを受信
      setRemoteStream(event.streams[0]);
    };

    setPeerConnection(pc);
    return pc;
  };

  // メディアストリームの取得
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      return null;
    }
  };

  // ユーザーA: 発信処理
  const call = async () => {
    if (!ws()) {
      console.error('WebSocket is not connected.');
      return;
    }
    const pc = await setupPeerConnection();
    const stream = await getLocalStream();
    if (stream) {
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Offer SDPをシグナリングサーバー経由で送信
    ws()!.send(JSON.stringify({ type: 'offer', payload: offer }));
  };

  // ユーザーB: 着信応答処理
  const answerCall = async () => {
    if (!ws() || !incomingCall() || !peerConnection()) {
      console.error('Cannot answer call: WebSocket not connected, no incoming call, or no peer connection.');
      return;
    }

    const pc = peerConnection()!;
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall()!.payload));

    const stream = await getLocalStream();
    if (stream) {
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Answer SDPをシグナリングサーバー経由で送信
    ws()!.send(JSON.stringify({ type: 'answer', payload: answer }));

    setIncomingCall(null); // 着信通知を非表示
  };

  // ユーザーB: 着信拒否処理
  const rejectCall = () => {
    console.log("Call rejected");
    setIncomingCall(null); // 着信通知を非表示
    // 必要に応じて、拒否したことを相手に通知するシグナリングメッセージを送信することも可能
  };

  // 初期接続処理
  onMount(() => {
    connectWebSocket();
  })

  createEffect(() => {
    const rs = remoteStream();
    const video = remoteVideo();
    if (!video) return;
    if (!rs) return;
    video.srcObject = rs;
    video.play();
  })
  console.log('Remote stream started');



  return (
    <div>
      <h1>SolidJS WebRTC Sample</h1>
      <button onClick={call} disabled={!ws()}>発信</button>

      {incomingCall() && (
        <div>
          <p>着信があります...</p>
          <button onClick={answerCall}>応答</button>
          <button onClick={rejectCall}>拒否</button>
        </div>
      )}
      <div>
        <h2>Remote Video</h2>
        <video class="w-2xl" ref={setRemoteVideo} playsinline></video>
      </div>
    </div>
  );
}

export default App;