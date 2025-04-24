import { createSignal, onMount } from "solid-js";

export function useSignaling(url: string){
    const [ws,setWs] = createSignal<WebSocket | null>(null)

    const sendMessage = (message: string) => {
        if (ws()) {
            ws()!.send(message);
        } else {
            console.error("WebSocket is not connected.");
        }
    }
    const closeConnection = () => {
        if (ws()) {
            ws()!.close();
            setWs(null);
        } else {
            console.error("WebSocket is not connected.");
        }
    }

    onMount(()=>{
        const websocket = new WebSocket(url);
        setWs(websocket);

        websocket.onopen = () => {
            console.log("WebSocket connection established");
            setWs(websocket);
        };

        websocket.onmessage = (event) => {
            console.log("Message received:", event.data);
        };

        websocket.onclose = () => {
            console.log("WebSocket connection closed");
            setWs(null);
        };
    });
    return {
        sendMessage,
        closeConnection,
    }
}