package codelab.api.smart.sae.framework.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

import org.springframework.stereotype.Service;

/**
 * Currence Utility
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@Service
public class CurrencyService {

	public String format(BigDecimal number) {
		return NumberFormat.getCurrencyInstance(new Locale("pt")).format(number.doubleValue());
	}
}
