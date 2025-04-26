import { createSignal, onCleanup, onMount } from "solid-js";
import { SignalingMessage, SignalingMessageType } from "../model/signalingMessage";
import { type } from "arktype";


export function useSignalingClient(url: string,{
    onOffer,
    onAnswer,
    onIceCandidate,
}:{
    onOffer:(offer: RTCSessionDescriptionInit)=>void
    onAnswer:(answer: RTCSessionDescriptionInit)=>void
    onIceCandidate:(candidate: RTCIceCandidateInit)=>void
}) {
    const [ws,setWs] = createSignal<WebSocket | null>(null)
    const [error,setError] = createSignal<string | null>(null)

    const sendMessage = (message: string) => {
        if (ws()) {
            ws()!.send(message);
        } else {
            console.error("WebSocket is not connected.");
        }
    }
    const sendOffer=(offer: RTCSessionDescriptionInit) => {
        const websocket = ws();
        if(!websocket) return;

        const message:SignalingMessageType={
            type:"offer",
            payload:offer
        }
        sendMessage(JSON.stringify(message));
    }

    const sendAnswer=(descriptionInit: RTCSessionDescriptionInit) => {
        const websocket = ws();
        if(!websocket) return;
        const message:SignalingMessageType={
            type:"answer",
            payload:descriptionInit
        }
        sendMessage(JSON.stringify(message));
    }
    const sendIceCandidate=(candidate: RTCIceCandidateInit) => {
        const websocket = ws();
        if(!websocket) return;
        const message:SignalingMessageType={
            type:"candidate",
            payload:candidate
        }
        sendMessage(JSON.stringify(message));
    }

    onMount(()=>{
        const websocket = new WebSocket(url);
            setWs(websocket);

            websocket.onopen = () => {
                console.log("WebSocket connection opened");
            };

            websocket.onmessage = (event) => {
                console.log("Received message:", event.data);
                try{
                    
                    const message=SignalingMessage(event.data)
                    if(message instanceof type.errors){
                        console.error("Invalid message format:", message);
                        return;
                    }
                    switch (message.type) {
                        case "offer":
                            console.log("Received offer:", message.payload);
                            onOffer(message.payload);
                            break;
                        case "answer":
                            console.log("Received answer:", message.payload);
                            onAnswer(message.payload);
                            break;
                        case "candidate":
                            console.log("Received ICE candidate:", message.payload);
                            onIceCandidate(message.payload);
                            break;
                        default:
                            console.error("Unknown message type:", message.type);
                            setError("Unknown message type received.");
                            break;
                    }
                } catch (error) {
                    console.error("Error parsing message:", error);
                }
            };

            websocket.onerror = (event) => {
                console.error("WebSocket error:", event);
                setError("WebSocket error occurred.");
            };

            websocket.onclose = () => {
                console.log("WebSocket connection closed");
                setWs(null);
                setError("WebSocket connection closed.");
            };
    });

    onCleanup(()=>{
        if (ws()) {
            ws()!.close();
        }
        setWs(null);
        setError(null);
    })
    return {
        sendMessage,
        error,
        sendOffer,
        sendAnswer,
        sendIceCandidate
    }
}