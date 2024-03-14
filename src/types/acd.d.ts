/*! *****************************************************************************
Copyright (c) Gabriel Cornejo. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

type OutgoingMessageType = "MESSAGE" | "CODE" | "PRODUCE_CODE" | "ANSWER" | "ICE_CANDIDATE" | "OFFER";
interface ClientPackage {
    type: OutgoingMessageType,
    message: string
}

interface ChatProps {
    ws: React.RefObject<WebSocket>;
    messageFromWs: string
    wsState: WebSocketState
}

interface MessageHook {
    message: string
    setMessage: React.Dispatch<React.SetStateAction<string>>
}

interface ServerMessage {
    type: OutgoingMessageType;
    message: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    sessionID?: string;
}
