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
 
/**
 * 
 * @author Sacur Ibraimo
 *
 */
@Service
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

//	public String userPasswordEmail(String name, String nuit, String password) {
//		return "Caro utente" + name
//                + "<p>A sua conta foi criada com sucesso no Módulo de Reserva e Registo Online. "
//                + "Informamos que para terminar o seu registo, e obter crachá de participação, "
//                + "deverá aceder ao site https://mrro-sgt.rsig.gov.mz e inserir o seu utilizador: "
//                +  nuit + "de Registo e sua nova senha" + password+". Para o efeito, terá que percorrer os seguintes passos:"
//                + "A sua conta foi criada com sucesso no Módulo de Reserva e Registo Online, "
//                + "informamos que deverá aceder ao site https:\\mrro-sgt.rsig.gov.mz e inserir o seu utilizador: </p>"
//                + "<p> 1º) Aceda ao sistema através das credenciais recebidas na 2ª etapa do registo e Carregue o Comprovativo do Pagamento (Entrar/Lista de Eventos); </p>"
//                + "<p> 2º) Aguarde pela Notificação da confirmação do registo, no e-mail por si disponibilizado no acto do registo; </p>" 
//                + " <p> 3º) Visualize e Imprima o Crachá, disponibilizado no sistema logo após a confirmação do registo (Entrar/Crachá )</p>"
//                + "Dear user" + name  
//                + "<p> Your account has been successfully created in the Online Booking and Registration Module. "
//                + "Please be informed that in order to complete your registration, you must access the website: "
//                + "https://mrro-sgt.rsig.gov.mz and insert your username "
//                +  nuit + " and your new password " + password+ " and follow the steps below: </p>"  
//                +"<p> 1.	Access the system using the credentials received in the 2nd stage of registration and Upload the Proof of Payment (Login/Events List); </p>" 
//                + "<p> 2.	Wait for the notification of the confirmation of the registration in the e-mail provided by you at the time of registration; </p>" 
//                +"<p> 3.	View and Print the Badge, available on the system shortly after confirmation of the registration. (Enter/Badge); </p>";
//	}
//
//	public String userPasswordResetEmail(String name, String nuit, String password) {
//		return "Caro " + name
//
//				+ "<p>Na sequencia do seu pedido de acesso ao Módulo de Reserva e Registo Online, informamos que deverá aceder ao site https:\\mrro-sgt.rsig.gov.mz   e inserir o seu utilizador: <b>"
//
//				+ nuit + "</b>" + " e sua nova senha <b>" + password
//				+ "</b>. Para mais esclarecimento, contacto-nos através dos seguintes contactos: 8xxxxxxxxx.</p>"
//				+ "<p>Obrigado</p>";
//	}
	

}
