import { createSignal, onCleanup, onMount } from "solid-js";

enum VideoStatus {
    Idle = "Idle",
    Connected = "Connected",
    Disconnected = "Disconnected",
    Error = "Error",
}


export default function Video() {
    const [ws, setWs] = createSignal<WebSocket | null>(null);
    const [localStream, setLocalStream] = createSignal<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(null);
    const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null);
    const [status, setStatus] = createSignal<VideoStatus>(VideoStatus.Idle);
    const [localVideoRef, setLocalVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const [remoteVideoRef, setRemoteVideoRef] = createSignal<HTMLVideoElement | null>(null);

    onMount(() => {
        const websocket = new WebSocket("ws://192.168.1.10:8080/ws");

        websocket.onopen = () => {
            console.log("WebSocket connection opened");
            setWs(websocket);
            setStatus(VideoStatus.Connected);
        };

        websocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);
            switch (message.type) {
                case "offer":
                    setStatus(VideoStatus.Disconnected);
                    break;
                case "answer":
                    setStatus(VideoStatus.Connected);
                    break;
                case "iceCandidate":
                    setStatus(VideoStatus.Connected);
                    break;
                default:
                    console.error("Unknown message type:", message.type);
                    setStatus(VideoStatus.Error);
                    break;
            }
        };

        websocket.onclose = () => {
            console.log("WebSocket connection closed");
            setWs(null);
            setStatus(VideoStatus.Disconnected);
        };
        onCleanup(() => {
            if (websocket) {
                websocket.close();
            }
        }
        );
    })

    // ローカルビデオストリームの取得
    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            // ローカルビデオ要素にストリームを紐付け
            if (localVideoRef()) {
                localVideoRef()!.srcObject = stream;
            }
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    };
    return (
        <div>
            {status()}
        </div>
    )
}