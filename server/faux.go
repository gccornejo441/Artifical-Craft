package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Todo struct {
	UserID    int    `json:"userId"`
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

func Faux(c *gin.Context) {
	resp, err := http.Get("https://jsonplaceholder.typicode.com/todos/1")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	// Decode the JSON response into the Todo struct
	var todo Todo
	if err := json.NewDecoder(resp.Body).Decode(&todo); err != nil {
		log.Printf("Error decoding Todo JSON: %v", err)
		return
	}

	// Log the Todo object
	log.Printf("Todo requested: %+v", todo)
}

func FauxWebSocket(w http.ResponseWriter, r *http.Request){
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to set websocket upgrade:", err)
		return
	}
	defer conn.Close()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		myString := string(message)

		log.Printf("Received message: %s", myString)
		// err = conn.WriteMessage(mt, message)
		// if err != nil {
		// 	log.Println("Error writing message:", err)
		// 	break
		// }
	}
}