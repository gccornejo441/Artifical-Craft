package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/pion/webrtc/v4"
	"github.com/redis/go-redis/v9"

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
			log.Println("**********Error reading message:", err)
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
				SessionID string                    `json:"sessionID"`
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

		if clientPkg.Type == "CODE" {
			sessionID := uuid.New().String()

			RedisBank(sessionID, clientPkg)

			c.WriteMessage(websocket.TextMessage, []byte(sessionID))
		}

		if clientPkg.Type == "MESSAGE" {

			log.Println("Received message:", clientPkg.Message)

			clientMsgString := string(clientPkg.Message)

			if clientMsgString == "ping" || clientMsgString == "Pong" {

				pongResponse := struct {
					Type    string `json:"type"`
					Message string `json:"message"`
				}{
					Type:    "PONG",
					Message: "Pong",
				}

				respJSON, err := json.Marshal(pongResponse)
				if err != nil {
					log.Println("Failed to marshal response:", err)
					continue
				}

				if err := c.WriteMessage(websocket.TextMessage, respJSON); err != nil {
					log.Println("Failed to send message:", err)
					continue
				}
			} else {

				clientPkg.Message = "Hello, User!"
				clientPkg.Type = "Message"
				
				respJSON, err := json.Marshal(clientPkg)
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
}


func RedisBank(sessionID string, clientPackage ClientPackage) {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})
	defer rdb.Close()

	pkgJSON, err := json.Marshal(clientPackage)
	if err != nil {
		log.Printf("Error marshalling client package: %v", err)
		return
	}

	err = rdb.Set(ctx, sessionID, pkgJSON, time.Minute*1).Err()
	if err != nil {
		log.Printf("Error saving client package to Redis: %v", err)
		return
	}

	log.Printf("Client package saved to Redis with session ID %s", sessionID)
}
