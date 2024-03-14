package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
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
		return true
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
	Type      string             `json:"type"`
	Message   string             `json:"message"`
	SDP       SessionDescription `json:"sdp,omitempty"`
	ICE       ICECandidate       `json:"ice,omitempty"`
	SessionID string             `json:"sessionID"`
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

	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	for {
		var clientPkg ClientPackage
		_, message, err := c.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		err = json.Unmarshal(message, &clientPkg)
		if err != nil {
			log.Printf("Error unmarshalling: %v", err)
			continue
		}

		if clientPkg.Type == "PRODUCE_CODE" {
			sessionID := clientPkg.Message
			val, err := rdb.Get(ctx, sessionID).Result()
			if err == redis.Nil {
				log.Println("Session not found in Redis, creating new session")
				sessionID = uuid.New().String()

				offer, err := peerConnection.CreateOffer(nil)
				if err != nil {
					log.Println("Failed to create offer:", err)
					continue
				}

				err = peerConnection.SetLocalDescription(offer)
				if err != nil {
					log.Println("Failed to set local description:", err)
					continue
				}

				clientPkg.Type = "OFFER"
				clientPkg.Message = "Initial offer, waiting for answer..."
				clientPkg.SDP = SessionDescription{Type: "offer", SDP: offer.SDP}
				clientPkg.SessionID = sessionID

				RedisBank(sessionID, clientPkg, rdb)

				// response := struct {
				// 	SessionID string                    `json:"sessionID"`
				// 	SDP       webrtc.SessionDescription `json:"sdp"`
				// }{
				// 	SessionID: sessionID,
				// 	SDP:       offer,
				// }

				response := ClientPackage{
					Type:      "OFFER",
					Message:   "Initial offer, waiting for answer...",
					SDP:       SessionDescription{Type: "offer", SDP: offer.SDP},
					ICE:       ICECandidate{},
					SessionID: sessionID,
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
			} else if err != nil {
				log.Printf("Error retrieving session from Redis: %v", err)
			} else {
				if err := c.WriteMessage(websocket.TextMessage, []byte(val)); err != nil {
					log.Println("Failed to send Redis data:", err)
				}
			}
		}

		if clientPkg.Type == "CODE" {
			log.Println("Received code:", clientPkg.Message)
			sessionData, err := RetrieveFromRedis(clientPkg.Message)
			if err != nil {
				log.Printf("Error retrieving session from Redis: %v", err)
			}

			if sessionData != nil {
				if err := c.WriteMessage(websocket.TextMessage, sessionData); err != nil {
					log.Println("Failed to send message:", err)
					continue
				}
			} else {
				errMsg := "No session found in Redis"

				if err := c.WriteMessage(websocket.TextMessage, []byte(errMsg)); err != nil {

					log.Println("Failed to send message:", err)
					continue
				}

				log.Println(errMsg)
			}
		}

		if clientPkg.Type == "MESSAGE" {
			handleClientMessage(c, clientPkg)
		}

	}
}

func handleClientMessage(c *websocket.Conn, clientPkg ClientPackage) {
	log.Println("Received message:", clientPkg.Message)

	clientMsgString := strings.ToLower(clientPkg.Message)

	var response interface{}

	if clientMsgString == "ping" {
		response = struct {
			Type    string `json:"type"`
			Message string `json:"message"`
		}{
			Type:    "PONG",
			Message: "Pong",
		}
	} else {
		clientPkg.Message = "Hello, User!"
		clientPkg.Type = "Message"
		response = clientPkg
	}

	sendResponse(c, response)
}

func sendResponse(c *websocket.Conn, response interface{}) {
	respJSON, err := json.Marshal(response)
	if err != nil {
		log.Println("Failed to marshal response:", err)
		return
	}

	if err := c.WriteMessage(websocket.TextMessage, respJSON); err != nil {
		log.Println("Failed to send message:", err)
	}
}

func RetrieveFromRedis(sessionID string) ([]byte, error) {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	defer rdb.Close()

	data, err := rdb.Get(ctx, sessionID).Bytes()
	if err == redis.Nil {
		log.Printf("Session not found for ID: %s", sessionID)
		return nil, nil
	} else if err != nil {
		log.Printf("Error retrieving session from Redis: %v", err)
		return nil, err
	}

	log.Printf("Session retrieved from Redis with ID: %s", sessionID)
	return data, nil
}

func RedisBank(sessionID string, clientPackage ClientPackage, rdb *redis.Client) {
	ctx := context.Background()

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
