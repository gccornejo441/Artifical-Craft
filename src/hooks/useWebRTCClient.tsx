import {useEffect, useState} from 'react';

interface ServerMessage {
    type: 'OFFER' | 'ICE_CANDIDATE' | 'SESSION_DESCRIPTION';
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    sessionID?: string;
  }

export const useWebRTCClient = (url: string) => {
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const ws = new WebSocket(url);

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          });

          setPeerConnection(pc);

          ws.onmessage = (event) => {
            const data: ServerMessage = JSON.parse(event.data);
      
            switch (data.type) {
              case 'OFFER':
                handleOffer(data.sdp!, pc, ws);
                break;
              case 'ICE_CANDIDATE':
                handleIceCandidate(data.candidate!, pc);
                break;
              default:
                console.error('Unknown message type:', data.type);
            }
          };

          return () => {
            ws.close();
            pc.close();
          };
    },[])

    return { peerConnection, setPeerConnection }
}

const handleOffer = (sdp: RTCSessionDescriptionInit, pc: RTCPeerConnection, websocket: WebSocket) => {
    pc.setRemoteDescription(new RTCSessionDescription(sdp))
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        websocket.send(JSON.stringify({
          type: 'ANSWER',
          sdp: pc.localDescription,
        }));
      })
      .catch((error) => console.error('Error handling offer:', error));
  };
  
  const handleIceCandidate = (candidate: RTCIceCandidateInit, pc: RTCPeerConnection) => {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
      .catch((error) => console.error('Error adding received ICE candidate:', error));
  };
  
  