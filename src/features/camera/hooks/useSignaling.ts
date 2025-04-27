import { createSignal, onCleanup, onMount } from "solid-js";
import { SignalingMessage, SignalingMessageType } from "../model/signalingMessage";
import { type } from "arktype";


export function useSignalingClient(url: string, {
    onOffer,
    onAnswer,
    onIceCandidate,
}: {
    onOffer: (offer: RTCSessionDescriptionInit) => void
    onAnswer: (answer: RTCSessionDescriptionInit) => void
    onIceCandidate: (candidate: RTCIceCandidateInit) => void
}) {
    const [ws, setWs] = createSignal<WebSocket | null>(null)
    const [error, setError] = createSignal<string | null>(null)

    const sendMessage = (message: string) => {
        if (ws()) {
            ws()!.send(message);
        } else {
            console.error("WebSocket is not connected.");
        }
    }
    const sendOffer = (offer: RTCSessionDescriptionInit) => {
        const websocket = ws();
        if (!websocket) return;

        const message = SignalingMessage({
            type: "offer",
            payload: offer
        } satisfies SignalingMessageType)
        sendMessage(JSON.stringify(message));
    }

    const sendAnswer = (descriptionInit: RTCSessionDescriptionInit) => {
        const websocket = ws();
        if (!websocket) return;
        const message = SignalingMessage({
            type: "answer",
            payload: descriptionInit
        } satisfies SignalingMessageType)
        sendMessage(JSON.stringify(message));
    }
    const sendIceCandidate = (candidate: RTCIceCandidate) => {
        const websocket = ws();
        if (!websocket) return;
        const message = SignalingMessage({
            type: "candidate",
            payload: candidate
        } satisfies SignalingMessageType)
        sendMessage(JSON.stringify(message));
    }


    onMount(() => {
        const websocket = new WebSocket(url);
        setWs(websocket);

        websocket.onopen = () => {
            console.log("WebSocket connection opened");
        };

        websocket.onmessage = (event) => {
            console.log("Received message:", event.data);
            const message = SignalingMessage(event.data)
            if (message instanceof type.errors) {
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

    onCleanup(() => {
        const websocket = ws();
        if (!websocket) return;
        websocket.close();
        console.log("WebSocket connection closed");
        setWs(null);
        setError(null);
    })
    return {
        sendOffer,
        sendAnswer,
        sendIceCandidate
    }
}