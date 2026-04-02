package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;

/**
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */

@SpringBootApplication
@EntityScan(basePackages = { "codelab.api.smart.sae" })
@ComponentScan(basePackages = { "codelab.api.smart.sae" })
public class SmartSAEApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		SpringApplication.run(SmartSAEApplication.class, args);

	}

}
