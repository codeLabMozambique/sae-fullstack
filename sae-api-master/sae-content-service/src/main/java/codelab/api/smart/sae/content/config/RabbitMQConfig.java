package codelab.api.smart.sae.content.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "smartsae.exchange";
    public static final String QUEUE_CONTENT_CREATED = "content.created.queue";
    public static final String QUEUE_READING_PROGRESS = "reading.progress.queue";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue contentCreatedQueue() {
        return new Queue(QUEUE_CONTENT_CREATED);
    }

    @Bean
    public Queue readingProgressQueue() {
        return new Queue(QUEUE_READING_PROGRESS);
    }

    @Bean
    public Binding bindingContentCreated(Queue contentCreatedQueue, TopicExchange exchange) {
        return BindingBuilder.bind(contentCreatedQueue).to(exchange).with("content.created");
    }

    @Bean
    public Binding bindingReadingProgress(Queue readingProgressQueue, TopicExchange exchange) {
        return BindingBuilder.bind(readingProgressQueue).to(exchange).with("reading.progress");
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
