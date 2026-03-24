 package codelab.api.smart.sae.framework.util;

 import jakarta.mail.MessagingException;
 import jakarta.mail.internet.MimeMessage;

 import org.springframework.beans.factory.annotation.Autowired;
 import org.springframework.mail.javamail.JavaMailSender;
 import org.springframework.mail.javamail.MimeMessageHelper;
 import org.springframework.scheduling.annotation.Async;
 import org.springframework.stereotype.Service;

 import codelab.api.smart.sae.framework.exception.BusinessException;

 @Service
 public class EmailService {

 	@Autowired
 	private JavaMailSender mailSender;

 	@Async
 	public void send(String to, String subject, String mail) {

 		try {

 			MimeMessage mimeMessage = mailSender.createMimeMessage();
 			MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
 			helper.setTo(to);
 			helper.setFrom("info@smartsae.com");
 			helper.setSubject(subject);
 			helper.setText(mail, true);
 			mailSender.send(mimeMessage);

 		} catch (MessagingException e) {
 			throw new BusinessException("Ocorreu um erro ao enviar o email");
 		}
 	}

 	public String accountCreationEMail(String name, String password) {
 		return "Caro(a) " + name + "<p> A sua conta foi criada com sucesso.</p>" + "<p> A senha de acesso é <b>"
 				+ password + "</b> e pode ser trocada após do login </p>" + "<p>Obrigado</p>";
 	}

 	public String inactiveAccountCreationEMail(String name) {
 		return "Caro(a) " + name
 				+ "<p>A sua conta foi criada com sucesso. Contudo ela ficará inactiva até que seja validada com base no documento carregado durante a criacão da conta</p>"
 				+ "<p>Obrigado</p>";
 	}

 	public String accountValidationEmail(String name, String password) {
 		return "Caro(a) " + name + "<p>A sua conta foi validada  com sucesso.</p>" + "<p>A senha de acesso é <b>"
 				+ password + "</b> e pode ser trocada após do login link: https://smartsae.com </p>" +  "<p>Obrigado</p>";
 	}

 }


