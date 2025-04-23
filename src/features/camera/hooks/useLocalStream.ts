import { createSignal } from "solid-js"

export function useLocalStream(){
    const [stream, setStream] = createSignal<MediaStream | null>(null)

    const startStream = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
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
    const isStreamActive = () => stream() !== null

    return {
        stream,
        startStream,
        stopStream,
        isStreamActive,
    }
}