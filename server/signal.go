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
		return true
	},
}

type SDPType string

type SessionDescription struct {
	Type SDPType `json:"type"`
	SDP  string  `json:"sdp"`
}

type ClientPackage struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

func Signal(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	defer c.Close()

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}
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
		var clientPkg ClientPackage
		
		messageType, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}

		log.Printf("recv: %s", message)

		var myMessageToSender = []byte("Pong!")

		if string(message) == "Ping" {
			myMessageToSender = []byte("Pong!")
		} else {
			myMessageToSender = []byte("Hi, Pal")
		}

		c.WriteMessage(messageType, myMessageToSender)
	}
}
