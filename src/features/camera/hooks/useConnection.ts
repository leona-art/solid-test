import { createSignal } from "solid-js"


// WebRTCのコネクションを管理するためのカスタムフック
export function useRTCConnection(){
    const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null)
    
}