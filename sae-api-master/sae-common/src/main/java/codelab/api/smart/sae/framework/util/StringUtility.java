package codelab.api.smart.sae.framework.util;

import java.text.Normalizer;
import java.text.Normalizer.Form;

/**
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
public class StringUtility {

	private static final StringUtility instance = new StringUtility();

	public static StringUtility getInstance() {
		return instance;
	}

	private StringUtility() {
	}

	public static String normalize(String text) {
		String normalized = Normalizer.normalize(text, Form.NFD).replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
		return String.valueOf(normalized).toUpperCase();
	}

}
