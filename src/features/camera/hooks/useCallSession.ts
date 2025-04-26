import { createSignal } from "solid-js";
import { useSignalingClient } from "./useSignaling";

type SessionState={
    type:"idle"
}|{
    type:"calling"
}|{
    type:"receiving"
}|{
    type:"connected",
    remoteStream: MediaStream
}|{
    type:"disconnected"
}
export function useCallSession(localStream: MediaStream | null, remoteStream: MediaStream | null) {
    const [sessionState, setSessionState] = createSignal<SessionState>({ type: "idle" });
    const {}=useSignalingClient("",()=>{
        
    })
    const startCall = async () => {
        setSessionState({ type: "calling" });
        // ここでWebRTCのコールを開始する処理を実装
    };

    const acceptCall = async () => {
        setSessionState({ type: "receiving" });
        // ここでWebRTCのコールを受け入れる処理を実装
    }
    const rejectCall = async () => {
        setSessionState({ type: "idle" });
        // ここでWebRTCのコールを拒否する処理を実装
    }

    const hungUpCall = async () => {
        setSessionState({ type: "disconnected" });
        // ここでWebRTCのコールを切断する処理を実装
    }

}