import {type} from "arktype";

const messageType=type("'offer'|'answer'|'candidate'");

export const SignalingMessage=type({
    type:messageType,
    payload:"object"
})

export type SignalingMessageType=typeof SignalingMessage.infer;

export const parseSignalingMessage=type("string")
    .pipe(s=>JSON.parse(s))
    .to(SignalingMessage)