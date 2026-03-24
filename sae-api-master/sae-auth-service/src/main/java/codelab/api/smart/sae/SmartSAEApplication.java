package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

import codelab.api.smart.sae.framework.config.SmartSAEConfig; 

/**
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */

@SpringBootApplication
@EnableConfigurationProperties(SmartSAEConfig.class)
public class SmartSAEApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		SpringApplication.run(SmartSAEApplication.class, args);

	}

}
