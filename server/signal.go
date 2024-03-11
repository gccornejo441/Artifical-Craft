package main

import (
	"log"
	"net/http"

	"fmt"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Adjust this to a more secure setting in production
	},
}

type SDPType string

type SessionDescription struct {
	Type SDPType `json:"type"`
	SDP  string  `json:"sdp"`
}

func Signal(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	defer c.Close()

	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		panic(err)
	}

	dc, err := pc.CreateDataChannel("chat", nil)
	if err != nil {
		panic(err)
	}

	dc.OnOpen(func() {
		err = dc.SendText("Hello World")
	})

	pc.OnDataChannel(func(d *webrtc.DataChannel) {
		dc.OnOpen(func() {
			fmt.Printf("New stream received from DataChannel '%s'\n", d.Label())
		})

		d.OnMessage(func(msg webrtc.DataChannelMessage) {
			fmt.Printf("Message from DataChannel '%s': %s\n", d.Label(), string(msg.Data))
		})
	})

	pc.OnICEConnectionStateChange(func(connState webrtc.ICEConnectionState) {
		fmt.Printf("ICE Connection State has changed: %s\n", connState.String())
	})

	offer, err := pc.CreateAnswer(nil)
	if err != nil {
		panic(err)
	}

	err = pc.SetLocalDescription(offer)
	if err != nil {
		panic(err)
	}

	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}

		log.Printf("recv: %s", message)

		var myMessageToSender = []byte("Pong!")

		if string(message) == "Ping" {
			myMessageToSender = []byte("Pong!")
		}

		c.WriteMessage(messageType, myMessageToSender)
	}
}
