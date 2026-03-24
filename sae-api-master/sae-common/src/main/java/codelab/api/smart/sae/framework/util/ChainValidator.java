package codelab.api.smart.sae.framework.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Chain Validator
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
public class ChainValidator {

	List<ValidationRule> rules = new ArrayList<>();

	public ChainValidator append(ValidationRule rule) {
		rules.add(rule);
		return this;
	}

	public void validate() {
		rules.forEach(ValidationRule::validate);
	}

}
