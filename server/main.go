package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func main() {
	r := gin.Default()

	r.Use(cors.Default())

	r.GET("/ws", func(c *gin.Context) {
		Signal(c.Writer, c.Request)
	})

	//r.GET("/todo", Faux)

	r.Run(":8080")
}


