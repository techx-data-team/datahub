package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"gopkg.in/gomail.v2"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

const bootstrap_servers = "ip-172-31-1-103.ap-southeast-1.compute.internal:9092"
const group_id = "my-first-application"
const topic = "DataHubUsageEvent_v1"

type DatahubEvents struct {
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp"`
	User      string
	Data      map[string]interface{} `json:"-"`
}

// const topic_arn = "arn:aws:sns:ap-southeast-1:928211084627:GoAWSSNS"
// const msg = "content"

func sendMailSMTP(wg *sync.WaitGroup, msgChannel chan *DatahubEvents) {
	defer wg.Done()
	d := gomail.NewDialer("smtp.office365.com", 587, "thanh.tran@techxcorp.com", "612Diablo")
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)
	is_running := true
	for is_running {
		select {
		case sig := <-sigchan:
			fmt.Printf("Caught signal %v: terminating email sender\n", sig)
			is_running = false
		case msg := <-msgChannel:
			m := gomail.NewMessage()
			m.SetHeader("From", "thanh.tran@techxcorp.com")
			m.SetHeader("To", "thanh.tran@techxcorp.com")
			m.SetAddressHeader("Cc", "tan.thai@techxcorp.com", "TAN")
			m.SetHeader("Subject", "DataHub Alert")
			if data, err := json.Marshal(msg); err == nil {
				m.SetBody("text/html", string(data))
			}

			fmt.Println(d)
			if err := d.DialAndSend(m); err != nil {
				fmt.Printf("Email send error: %v (%v)\n", err, msg)
			}
		}
	}

}

func kafkaConsumer(wg *sync.WaitGroup, msgChannel chan *DatahubEvents) {
	defer wg.Done()
	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": bootstrap_servers,
		"group.id":          group_id,
		"auto.offset.reset": "earliest",
	})
	if err != nil {
		panic(err)
	}
	c.Subscribe(topic, nil)
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)
	is_running := true
	// unique_list := make(map[string]int, 0)
	for is_running {
		select {
		case sig := <-sigchan:
			fmt.Printf("Caught signal %v: terminating kafka consumer\n", sig)
			is_running = false
		default:

			msg, err := c.ReadMessage(1000 * time.Millisecond)
			if err == nil {

				event := DatahubEvents{}
				json.Unmarshal(msg.Value, &event.Data)
				event.User = string(msg.Key)
				if n, ok := event.Data["type"].(string); ok {
					event.Type = n
				}
				if n, ok := event.Data["timestamp"].(float64); ok {
					event.Timestamp = int64(n)
				}
				if event.Type == "EntityActionEvent" {
					fmt.Printf("Message on %s: %v\n", msg.TopicPartition, event)
					msgChannel <- &event
				}

				// if _, ok := unique_list[event.Type]; ok {
				// 	unique_list[event.Type] += 1
				// } else {
				// 	unique_list[event.Type] = 0
				// }
				// fmt.Printf("Message on %s: %v\n", msg.TopicPartition, unique_list)
				// sendMail()
				// fmt.Printf("Send mail")
			} else {
				// The client will automatically try to recover from all errors.
				if fmt.Sprintf("%v", err) != "Local: Timed out" {
					fmt.Printf("Consumer error: %v (%v)\n", err, msg)
				}
			}
		}
	}
	c.Close()
}

func main() {
	// sendMailSMTP()
	var wg sync.WaitGroup
	msgChannel := make(chan *DatahubEvents, 30)
	wg.Add(2)
	go kafkaConsumer(&wg, msgChannel)
	go sendMailSMTP(&wg, msgChannel)
	wg.Wait()
	fmt.Printf("Exit Datahub Notification\n")
}
