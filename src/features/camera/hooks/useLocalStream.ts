import { createSignal } from "solid-js"

export function useLocalStream(){
    const [stream, setStream] = createSignal<MediaStream | null>(null)
    const isStreamActive = () => stream() !== null

    const startStream = async () => {
        if (isStreamActive()) {
            console.warn("Stream is already active.")
            return
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode:"environment",
                },
                audio: false,
            })
            setStream(mediaStream)
        } catch (error) {
            console.error("Error accessing media devices.", error)
        }
    }
    const stopStream = () => {
        if (stream()) {
            stream()!.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }
    

    return {
        stream,
        startStream,
        stopStream,
        isStreamActive,
    }
}