package codelab.api.smart.sae.integ.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class IntegPayload implements Serializable {

	private static final long serialVersionUID = -3522561440192683868L;

	private String transactionCode;

	 private List<Map<String, Object>> payload = new ArrayList<>();
	
	 public IntegPayload() {
		super();
	}

	public String getTransactionCode() {
		return transactionCode;
	}

	public void setTransactionCode(String transactionCode) {
		this.transactionCode = transactionCode;
	}

	public List<Map<String, Object>> getPayload() {
		return payload;
	}

	public void setPayload(List<Map<String, Object>> payload) {
		this.payload = payload;
	}


}
