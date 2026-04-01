package codelab.api.smart.sae.framework.security;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import codelab.api.smart.sae.integ.model.IntegPayload;
import codelab.api.smart.sae.user.dto.AuthenticationRequestDTO;

@Service
public class ApiGatewayService {

	// TODO: move to database
	public static final String GATEWAY_AUTH_URL = "http://172.31.4.65:8081/gatewayapi/services/api/v1.0/secure/autenticate";

	public static final String GATEWAY_REQUEST_URL = "http://172.31.4.65:8081/gatewayapi/services/api/v1.0/request";

	public static final String PRF_PRICE_PROPOSAL_KEY = "MWRkZWRjODUtMjRlOC00MGI2LWE3NjMtYTc3YjQwNzc1NmY3OmUyYjE0MWJlLTU1ZTctNDIxZi05YmQxLWVlZjRiM2Y4MDQwOA==";

	public static final String CBS_ITEM_PROPOSAL_KEY = "ODg1MTQ5OTMtNTBjMy00ZDBiLWFhOWItZTUzZjliY2ZiYmM2OjQwN2E5ZTIwLTZkMjItNDZlOC1hODFjLTYwMTQzMDlmNGNkNQ==";

	public static final String CEF_ENROLLMENT_REQUEST_KEY = "ZDE3MzNmM2QtMzRkZC00ZGI1LTlkNjMtOWUxMDczZmQ1N2Y3OjUwZGQwY2I5LTg4YzktNDQ3ZS1hOWE2LTgyMThmNWM4NDE1Mg==";

	public static final String CEF_ENROLLMENT_UPDATE_REQUEST_KEY = "MWRkZWRjODUtMjRlOC00MGI2LWE3NjMtYTc3YjQwNzc1NmY3OmUyYjE0MWJlLTU1ZTctNDIxZi05YmQxLWVlZjRiM2Y4MDQwOA==";

	public String authenticate(String contractKey) {

		RestTemplate restTemplate = new RestTemplate();

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.add("Authorization", "basic " + contractKey);

		HttpEntity<AuthenticationRequestDTO> request = new HttpEntity<>(new AuthenticationRequestDTO(), headers);

		ResponseEntity<String> response = restTemplate.exchange(ApiGatewayService.GATEWAY_AUTH_URL, HttpMethod.POST,
				request,
				String.class);

		return response.getHeaders().get("Authorization").get(0);

	}

	public HttpHeaders getHeaders(String contractKey) {

		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(authenticate(contractKey).substring(7));
		headers.setContentType(MediaType.APPLICATION_JSON);

		return headers;
	}

	// public ResponseEntity<IntegPayload> postRequest(String contractKey,
	// IntegPayload payload) {
	//
	// RestTemplate restTemplate = new RestTemplate();
	// HttpHeaders headers = getHeaders(contractKey);
	//
	// HttpEntity<IntegPayload> request = new HttpEntity<>(payload, headers);
	//
	// ResponseEntity<IntegPayload> response =
	// restTemplate.exchange(ApiGatewayService.GATEWAY_REQUEST_URL, HttpMethod.POST,
	// request,
	// IntegPayload.class);
	//
	// return response;
	// }

	public ResponseEntity<IntegPayload> postRequest(String contractKey, IntegPayload payload) {
		Optional<IntegPayload> optional;
		try {
			optional = Optional.ofNullable(WebClient.create()
					.post()
					.uri(new URI(ApiGatewayService.GATEWAY_REQUEST_URL))
					.header(HttpHeaders.AUTHORIZATION, "Bearer " + authenticate(contractKey).substring(7))
					.contentType(MediaType.APPLICATION_JSON)
					.accept(MediaType.APPLICATION_JSON)
					.body(BodyInserters.fromValue(payload))
					.retrieve()
					.bodyToMono(IntegPayload.class)
					.block());
		} catch (URISyntaxException e) {
			return ResponseEntity.of(Optional.empty());
		}
		return ResponseEntity.of(optional);
	}

}