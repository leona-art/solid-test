import { createEffect, createSignal, Show } from "solid-js"
import { useLocalStream } from "../hooks/useLocalStream"
import { useSignalingClient } from "../hooks/useSignaling"
import { usePeerConnection } from "../hooks/usePeerConnection"

export function LocalVideo() {
    const handleSignalingMessage = (msg: SignalingMessage) => {
        // 受信したメッセージの type を見て、Peer Connection 側の対応する処理を呼び出す
        console.log("Handling signaling message:", msg.type, msg.payload);

        switch (msg.type) {
            case 'offer':
                // usePeerConnection の setRemoteDescription(msg.payload) を呼び出す
                // usePeerConnection の createAndSendAnswer() を呼び出す
                createAndSendAnswer()
                break;
            case 'answer':
                // usePeerConnection の setRemoteDescription(msg.payload) を呼び出す
                setRemoteDescription(msg.payload)
                break;
            case 'iceCandidate':

                addCandidate(msg.payload) // usePeerConnection の addIceCandidate(msg.payload) を呼び出す
                break;
            // 他のメッセージタイプ（例: 'call', 'hangup', 'chat' など）
            default:
                console.warn("Unknown signaling message type:", msg.type);
                break;
        }
    };
    const { sendAnswer,sendIceCandidate,sendOffer } = useSignalingClient("wss://192.168.1.10:8443/ws", {
        onOffer:()=>{},
        onAnswer:()=>{},
        onIceCandidate:()=>{},
    })
    const { stream, startStream, stopStream } = useLocalStream()
    const { remoteStream, addLocalTrack, createAndSendAnswer, setRemoteDescription, addCandidate } = usePeerConnection(sendMessage)
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null)
    const [remoteVideoRef, setRemoteVideoRef] = createSignal<HTMLVideoElement | null>(null)
    const handleStartStream = async () => {
        await startStream()
        if (stream()) {
            videoRef()!.srcObject = stream()
            addLocalTrack(stream())
        }
        if (videoRef()) {
            videoRef()!.play()
        }

    }
    const handleStopStream = async () => {
        await stopStream()
        if (videoRef()) {
            videoRef()!.pause()
        }
        if (stream()) {
            videoRef()!.srcObject = null
        }

    }
    createEffect(() => {
        console.log("stream", stream())
    })
    createEffect(() => console.log("remote stream", remoteStream()))
    createEffect(() => {
        const rs = remoteStream()
        const rvr = remoteVideoRef()
        console.log("remoteStream", rs)
        console.log("remoteVideoRef", rvr)
        if (rs && rvr) {
            rvr.srcObject = rs
            rvr.play()
        }
    })
    return (
        <div class="w-full h-full">
            <div>
                {error() && <p class="text-red-500">{error()}</p>}
            </div>
            <video
                ref={setVideoRef}
                class="w-full h-full object-cover"
                playsinline
            />
            <Show when={remoteStream()}>
                <video
                    class="w-full h-full object-cover"
                    ref={setRemoteVideoRef}
                    playsinline
                />
            </Show>
            <button onClick={handleStartStream} class="bg-blue-500 text-white p-2 rounded">
                Start Stream
            </button>
            <button onClick={handleStopStream} class="bg-red-500 text-white p-2 rounded">
                Stop Stream
            </button>
        </div>
    )
}