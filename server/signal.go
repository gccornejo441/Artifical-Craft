package main

import (
	"encoding/json"
	"log"
	"net/http"
    "github.com/pion/webrtc/v4"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins
	},
}

type SDPType string

type SessionDescription struct {
	Type SDPType `json:"type"`
	SDP  string  `json:"sdp"`
}

type ICECandidate struct {
	Candidate string `json:"candidate"`
}

type ClientPackage struct {
	Type    string             `json:"type"`
	Message string             `json:"message"`
	SDP     SessionDescription `json:"sdp,omitempty"`
	ICE     ICECandidate       `json:"ice,omitempty"`
}

func Signal(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()

    peerConnection, err := webrtc.NewPeerConnection(webrtc.Configuration{})
    if err != nil {
        log.Println("Failed to create a new PeerConnection:", err)
        return
    }
    defer peerConnection.Close()

    for {
        var clientPkg ClientPackage
        _, message, err := c.ReadMessage()
        if err != nil {
            log.Println("read:", err)
            break
        }

        err = json.Unmarshal(message, &clientPkg)
        if err != nil {
            log.Printf("Error unmarshalling: %v", err)
            continue
        }

        if clientPkg.Type == "PRODUCE_CODE" {
            // Generate a UUID for the session ID
            sessionID := uuid.New().String()

            // Create an SDP offer
            offer, err := peerConnection.CreateOffer(nil)
            if err != nil {
                log.Println("Failed to create offer:", err)
                continue
            }

            // Set the local description to the offer
            err = peerConnection.SetLocalDescription(offer)
            if err != nil {
                log.Println("Failed to set local description:", err)
                continue
            }

            // Send the offer as JSON including the session ID, SDP, and ICE candidates
            response := struct {
                SessionID string                  `json:"sessionID"`
                SDP       webrtc.SessionDescription `json:"sdp"`
            }{
                SessionID: sessionID,
                SDP:       offer,
            }

            respJSON, err := json.Marshal(response)
            if err != nil {
                log.Println("Failed to marshal response:", err)
                continue
            }

            if err := c.WriteMessage(websocket.TextMessage, respJSON); err != nil {
                log.Println("Failed to send message:", err)
                continue
            }
        }
    }
}
