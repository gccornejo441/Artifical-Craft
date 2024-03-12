package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"log"
)

func main() {
	r := gin.Default()

	r.Use(cors.Default())

	r.GET("/ws", func(c *gin.Context) {
		Signal(c.Writer, c.Request)
	})

	r.POST("/code", HandleCode)

	//r.GET("/todo", Faux)

	r.Run(":8080")
}

type Code struct {
	Code string `json:"code"`
}

func HandleCode(c *gin.Context) {
	var code Code

	if err := c.ShouldBindJSON(&code); err != nil {
		c.JSON(400, gin.H{
			"error": err.Error(),
		})
		return
	}

	log.Printf("Received code: %+v\n", code)

	c.JSON(200, gin.H{
		"message": "Hello World",
	})
}

