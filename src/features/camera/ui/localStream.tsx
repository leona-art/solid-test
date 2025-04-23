import { createEffect, createSignal } from "solid-js"
import { useLocalStream } from "../hooks/useLocalStream"

export function LocalVideo(){
    const { stream, startStream, stopStream } = useLocalStream()
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null)

    const handleStartStream = async () => {
        await startStream()
        if (stream()) {
            videoRef()!.srcObject = stream()
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
    createEffect(()=>{
        console.log("stream", stream())
    })
    return (
        <div class="w-full h-full">
            <video
                ref={setVideoRef}
                class="w-full h-full object-cover"
                playsinline
            />
            <button onClick={handleStartStream} class="bg-blue-500 text-white p-2 rounded">
                Start Stream
            </button>
            <button onClick={handleStopStream} class="bg-red-500 text-white p-2 rounded">
                Stop Stream
            </button>
        </div>
    )
}