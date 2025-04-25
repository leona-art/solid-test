import { createSignal, onCleanup, onMount } from "solid-js";

export function usePeerConnection(sendMessage: (message: string) => void) {
    const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null);
    const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(null);



    onMount(() => {
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("ICE Candidate:", event.candidate);
                sendMessage(JSON.stringify({ type: "iceCandidate", payload: event.candidate }));
            }
        };

        pc.ontrack = (event) => {
            console.log("Track received:", event.track);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                const newStream = new MediaStream();
                newStream.addTrack(event.track);
                setRemoteStream(newStream);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", pc.iceConnectionState);
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed") {
                console.log("ICE Connection failed");
                pc.close();
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log("Offer created and set as local description:", offer);
            } catch (error) {
                console.error("Error during negotiation:", error);
            }
        };

        setPeerConnection(pc);
    });

    const closePeerConnection = () => {
        if (peerConnection()) {
            console.log("Closing peer connection.");
            peerConnection()!.close();
            setPeerConnection(null);
            setRemoteStream(null);
            // 必要に応じて、useLocalStream().stopStream() なども呼び出す
        }
    };

    // ローカルストリームのトラックをPeer Connectionに追加する関数
    const addLocalTrack = (localStream: MediaStream | null) => {
        const pc = peerConnection();
        if (!pc || !localStream) return;

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
    }

    const createAndSendOffer = async () => {
        const pc = peerConnection();
        if (!pc) return;

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log("Offer created and set as local description:", offer);
            sendMessage(JSON.stringify({ type: "offer", payload: offer }));
        } catch (error) {
            console.error("Error creating offer:", error);
        }
    }

    const createAndSendAnswer = async () => {
        const pc = peerConnection();
        if (!pc) return;

        try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log("Answer created and set as local description:", answer);
            sendMessage(JSON.stringify({ type: "answer", payload: answer }));
        } catch (error) {
            console.error("Error creating answer:", error);
        }
    }

    const setRemoteDescription = async (description: RTCSessionDescriptionInit) => {
        const pc = peerConnection();
        if (!pc) return;

        try {
            await pc.setRemoteDescription(description);
            console.log("Remote description set:", description);
            if (description.type === "offer") {
                createAndSendAnswer();
            }
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    }

    const addCandidate = async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnection();
        if (!pc || !candidate) return;

        try {
            await pc.addIceCandidate(candidate);
            console.log("ICE candidate added:", candidate);
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }


    // コンポーネントがクリーンアップされるときに接続を閉じる
    onCleanup(() => {
        closePeerConnection();
    });

    return {
        remoteStream,
        addLocalTrack,
        createAndSendOffer,
        createAndSendAnswer,
        setRemoteDescription,
        addCandidate,
        closePeerConnection,
    }
}