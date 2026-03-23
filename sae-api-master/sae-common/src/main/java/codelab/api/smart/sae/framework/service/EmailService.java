package codelab.api.smart.sae.framework.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import codelab.api.smart.sae.framework.exception.BusinessException;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;

/**
 * 
 * @author Sacur Ibraimo
 *
 */
@Service
@ConditionalOnBean(JavaMailSender.class)
public class EmailService {

	@Autowired
	private JavaMailSender mailSender;
	
	@Value("${spring.mail.username}")
	String username;

	@Async
	public String send(String to, String subject, String mail) {

		try {

			MimeMessage mimeMessage = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
			helper.setTo(to);
			helper.setFrom(username);
			helper.setSubject(subject);
			helper.setText(mail, true);
			mailSender.send(mimeMessage);
			return "email enviado com sucesso";

		} catch (MessagingException e) {
			throw new BusinessException("Ocorreu um erro ao enviar o email");
		}
	}
}
