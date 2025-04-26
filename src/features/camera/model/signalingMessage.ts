import { type } from "arktype";

const RTCIceCandidate = type({
    candidate: "string",
    address: "string | null",
    component: "'rtcp'|'rtp'|null",
    foundation: "string | null",
    port: "number | null",
    priority: "number | null",
    protocol: "'udp'|'tcp' | null",
    relatedAddress: "string | null",
    relatedPort: "number | null",
    sdpMLineIndex: "number | null",
    sdpMid: "string | null",
    tcpType: "'active'|'passive'|'so' | null",
    type: "'host'|'srflx'|'prflx'|'relay' | null",
    usernameFragment: "string | null",
});

const RTCSessionDescriptionInit = type({
    "sdp?": "string",
    type: "'answer'|'offer'|'pranswer'|'rollback'",
});


const CandidateMessage = type({
    type: "'candidate'",
    payload: RTCIceCandidate
});

const OfferMessage = type({
    type: "'offer'",
    payload: RTCSessionDescriptionInit
});

const AnswerMessage = type({
    type: "'answer'",
    payload: RTCSessionDescriptionInit
});



export const SignalingMessage = CandidateMessage
    .or(OfferMessage)
    .or(AnswerMessage)

export type SignalingMessageType = typeof SignalingMessage.infer;

export const parseSignalingMessage = type("string")
    .pipe(s => JSON.parse(s))
    .to(SignalingMessage)