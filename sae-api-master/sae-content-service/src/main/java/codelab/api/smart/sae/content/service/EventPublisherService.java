package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EventPublisherService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void publishContentCreated(String contentId, String title, String author) {
        java.util.HashMap<String, Object> message = new java.util.HashMap<>();
        message.put("id", contentId);
        message.put("title", title != null ? title : "");
        message.put("author", author != null ? author : "");
        message.put("timestamp", java.time.LocalDateTime.now().toString());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "content.created", message);
    }

    public void publishReadingProgress(String userId, String contentId, int page) {
        java.util.HashMap<String, Object> message = new java.util.HashMap<>();
        message.put("userId", userId != null ? userId : "");
        message.put("contentId", contentId != null ? contentId : "");
        message.put("page", page);
        message.put("timestamp", java.time.LocalDateTime.now().toString());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "reading.progress", message);
    }
}
