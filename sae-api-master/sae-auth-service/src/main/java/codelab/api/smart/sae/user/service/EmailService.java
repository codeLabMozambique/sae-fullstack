package codelab.api.smart.sae.user.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Async
    public void sendCredentials(String toEmail, String fullname, String username, String password, String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(java.util.Objects.requireNonNull(from));
            helper.setTo(java.util.Objects.requireNonNull(toEmail));
            helper.setSubject("SAE — As suas credenciais de acesso");

            String html = buildHtml(fullname, username, password, role);
            helper.setText(java.util.Objects.requireNonNull(html), true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Falha ao enviar email para " + toEmail + ": " + e.getMessage());
        }
    }

    private String buildHtml(String fullname, String username, String password, String role) {
        StringBuilder h = new StringBuilder();
        // wrapper + header
        h.append("<!DOCTYPE html><html lang='pt'><head><meta charset='UTF-8'></head>");
        h.append("<body style='margin:0;padding:0;background:linear-gradient(135deg,#e8f5e9,#f1f8e9);font-family:Arial,sans-serif'>");
        h.append("<table width='100%' cellpadding='0' cellspacing='0' style='padding:40px 16px'><tr><td align='center'>");
        h.append("<table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,166,81,0.12)'>");

        // header band
        h.append("<tr><td style='background:linear-gradient(135deg,#00a651,#007d3c);padding:36px 40px 28px'>");
        h.append("<p style='margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase'>Sistema de Apoio ao Estudante</p>");
        h.append("<h1 style='margin:0;font-size:28px;font-weight:800;color:#fff'>smartSAE</h1>");
        h.append("<div style='margin-top:12px;display:inline-block;background:rgba(255,255,255,0.18);border-radius:20px;padding:4px 14px'>");
        h.append("<span style='font-size:12px;font-weight:600;color:#fff'>&#10003;&nbsp;Conta criada com sucesso</span></div>");
        h.append("</td></tr>");

        // greeting
        h.append("<tr><td style='padding:32px 40px 8px'>");
        h.append("<p style='margin:0;font-size:17px;color:#1a2e1a'>Ol&#225;, <strong>").append(fullname).append("</strong>!</p>");
        h.append("<p style='margin:10px 0 0;font-size:14px;color:#555;line-height:1.6'>");
        h.append("A sua conta no <strong style='color:#00a651'>smartSAE</strong> foi criada. ");
        h.append("Utilize as credenciais abaixo para aceder &#224; plataforma.</p>");
        h.append("</td></tr>");

        // credentials card
        h.append("<tr><td style='padding:24px 40px'>");
        h.append("<div style='background:linear-gradient(135deg,#f0faf4,#e8f5e9);border-radius:12px;border:1px solid #c8e6c9;overflow:hidden'>");
        h.append("<div style='background:#00a651;padding:10px 20px'>");
        h.append("<span style='font-size:11px;font-weight:700;letter-spacing:2px;color:#fff;text-transform:uppercase'>&#128274;&nbsp;Credenciais de Acesso</span></div>");
        h.append("<table width='100%' cellpadding='0' cellspacing='0'>");
        // row: perfil
        h.append("<tr>");
        h.append("<td style='padding:14px 20px;width:130px;font-size:12px;font-weight:700;color:#007d3c;text-transform:uppercase;border-bottom:1px solid #c8e6c9'>Perfil</td>");
        h.append("<td style='padding:14px 20px;border-bottom:1px solid #c8e6c9'>");
        h.append("<span style='background:#00a651;color:#fff;border-radius:20px;padding:2px 12px;font-size:12px;font-weight:700'>").append(role).append("</span></td></tr>");
        // row: utilizador
        h.append("<tr>");
        h.append("<td style='padding:14px 20px;font-size:12px;font-weight:700;color:#007d3c;text-transform:uppercase;border-bottom:1px solid #c8e6c9'>Utilizador</td>");
        h.append("<td style='padding:14px 20px;font-family:Consolas,monospace;color:#1a2e1a;border-bottom:1px solid #c8e6c9'>").append(username).append("</td></tr>");
        // row: password
        h.append("<tr>");
        h.append("<td style='padding:14px 20px;font-size:12px;font-weight:700;color:#007d3c;text-transform:uppercase'>Palavra-passe</td>");
        h.append("<td style='padding:14px 20px;font-size:16px;font-family:Consolas,monospace;font-weight:800;color:#007d3c;letter-spacing:2px'>").append(password).append("</td></tr>");
        h.append("</table></div></td></tr>");

        // warning
        h.append("<tr><td style='padding:0 40px 28px'>");
        h.append("<div style='background:#fffde7;border-left:4px solid #f9a825;border-radius:0 8px 8px 0;padding:12px 16px'>");
        h.append("<span style='font-size:13px;color:#6d4c00;line-height:1.5'>&#9888;&nbsp;");
        h.append("<strong>Por seguran&#231;a</strong>, altere a sua palavra-passe no primeiro in&#237;cio de sess&#227;o.</span></div></td></tr>");

        // footer
        h.append("<tr><td style='background:#f8fdf9;border-top:1px solid #e8f5e9;padding:20px 40px'>");
        h.append("<p style='margin:0;font-size:12px;color:#888;line-height:1.6'>Atenciosamente,<br>");
        h.append("<strong style='color:#00a651'>Equipa smartSAE</strong></p></td></tr>");

        h.append("</table></td></tr></table></body></html>");
        return h.toString();
    }
}
