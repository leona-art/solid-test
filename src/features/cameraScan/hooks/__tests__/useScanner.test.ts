import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { createRoot, createSignal } from "solid-js"
import { useCameraScanner } from "../useScanner"

describe("useCameraScanner", () => {
    let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia

    beforeAll(() => {
        // mediaDevicesがなければ作る
        if (!navigator.mediaDevices) {
            // @ts-ignore
            navigator.mediaDevices = {}
        }
        originalGetUserMedia = navigator.mediaDevices.getUserMedia
    })

    afterAll(() => {
        if (originalGetUserMedia) {
            navigator.mediaDevices.getUserMedia = originalGetUserMedia
        } else {
            // @ts-ignore
            delete navigator.mediaDevices.getUserMedia
        }
    })

    it("initial state: camera inactive, no error", () => {
        createRoot(dispose => {
            const [video] = createSignal<HTMLVideoElement | null>(null)
            const { isCameraActive, error } = useCameraScanner(video)
            expect(isCameraActive()).toBe(false)
            expect(error()).toBe(null)
            dispose()
        })
    })

    it("startCamera without video element sets a missing‐element error", async () => {
        await createRoot(async dispose => {
            const [video] = createSignal<HTMLVideoElement | null>(null)
            const { startCamera, error, isCameraActive } = useCameraScanner(video)
            await startCamera()
            expect(isCameraActive()).toBe(false)
            expect(error()).toBe("ビデオ要素がまだ設定されていません。")
            dispose()
        })
    })

    it("startCamera/stopCamera success path", async () => {
        // mock a fake MediaStream with stoppable tracks
        const fakeTrack = { stop: vi.fn() }
        const fakeStream = {
            getTracks: () => [fakeTrack],
        } as unknown as MediaStream

        navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(fakeStream)

        await createRoot(async dispose => {
            // a dummy video element that supports play/pause
            const videoEl = {
                srcObject: null as unknown,
                muted: false,
                playsInline: false,
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
            } as unknown as HTMLVideoElement

            const [video, setVideo] = createSignal<HTMLVideoElement | null>(null)
            const { startCamera, stopCamera, isCameraActive, error } = useCameraScanner(video)

            // make video element available
            setVideo(videoEl)
            await startCamera()

            // after startCamera: active, no error, srcObject set
            expect(isCameraActive()).toBe(true)
            expect(error()).toBe(null)
            expect(videoEl.srcObject).toBe(fakeStream)
            expect(videoEl.muted).toBe(true)
            expect(videoEl.playsInline).toBe(true)
            expect(videoEl.play).toHaveBeenCalled()

            // stopCamera should stop tracks and clear stream+error
            stopCamera()
            expect(fakeTrack.stop).toHaveBeenCalled()
            expect(isCameraActive()).toBe(false)
            expect(error()).toBe(null)
            expect(videoEl.srcObject).toBeNull()
            dispose()
        })
    })

    it("handles NotAllowedError from getUserMedia", async () => {
        const err = new DOMException("Denied", "NotAllowedError")
        navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(err)

        await createRoot(async dispose => {
            const [video, setVideo] = createSignal<HTMLVideoElement | null>(null)
            const { startCamera, error, isCameraActive } = useCameraScanner(video)
            // attach a dummy video so we get past the "no element" case
            setVideo(document.createElement("video"))
            await startCamera()

            expect(isCameraActive()).toBe(false)
            expect(error()).toBe("カメラへのアクセスが許可されていません。")
            dispose()
        })
    })
})