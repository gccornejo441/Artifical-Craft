import { useEffect, useState } from 'react';


export const useWebRTCClient = () => {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    setPeerConnection(pc);

    return () => {
      pc.close();
    };
  }, [])

  return { peerConnection, setPeerConnection }
}

export const handleOffer = (sdp: RTCSessionDescriptionInit, pc: RTCPeerConnection, websocket: WebSocket) => {
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

export const handleIceCandidate = (candidate: RTCIceCandidateInit, pc: RTCPeerConnection) => {
  pc.addIceCandidate(new RTCIceCandidate(candidate))
    .catch((error) => console.error('Error adding received ICE candidate:', error));
};

