package codelab.api.smart.sae.framework.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration Property Class
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@ConfigurationProperties("smartSAE")
public class SmartSAEConfig {

	private Application application = new Application();
	private Security security = new Security();

	public Security getSecurity() {
		return security;
	}

	public Application getApplication() {
		return application;
	}

	public static class Application {

		private String remoteClientApi;

		public String getRemoteClientApi() {
			return remoteClientApi;
		}

		public void setRemoteClientApi(String remoteClientApi) {
			this.remoteClientApi = remoteClientApi;
		}
	}

	public static class Security {
		private String allowedOrigin;
		private int effectiveStartYear;
		private int accessTokenValiditySeconds;
		private int refreshTokenValiditySeconds;
		private boolean httpSecuredCookie;
		private String jwtAccessTokenConverterSecret;
		private String oauthWebClientId;
		private String oauthWebClientSecret;
		private String oauthMobileClientId;
		private String oauthMobileClientSecret;

		public String getAllowedOrigin() {
			return allowedOrigin;
		}

		public void setAllowedOrigin(String allowedOrigin) {
			this.allowedOrigin = allowedOrigin;
		}

		public int getEffectiveStartYear() {
			return effectiveStartYear;
		}

		public void setEffectiveStartYear(int effectiveStartYear) {
			this.effectiveStartYear = effectiveStartYear;
		}

		public int getAccessTokenValiditySeconds() {
			return accessTokenValiditySeconds;
		}

		public void setAccessTokenValiditySeconds(int accessTokenValiditySeconds) {
			this.accessTokenValiditySeconds = accessTokenValiditySeconds;
		}

		public int getRefreshTokenValiditySeconds() {
			return refreshTokenValiditySeconds;
		}

		public void setRefreshTokenValiditySeconds(int refreshTokenValiditySeconds) {
			this.refreshTokenValiditySeconds = refreshTokenValiditySeconds;
		}

		public boolean isHttpSecuredCookie() {
			return httpSecuredCookie;
		}

		public void setHttpSecuredCookie(boolean httpSecuredCookie) {
			this.httpSecuredCookie = httpSecuredCookie;
		}

		public String getJwtAccessTokenConverterSecret() {
			return this.jwtAccessTokenConverterSecret;
		}

		public void setJwtAccessTokenConverterSecret(String jwtAccessTokenConverterSecret) {
			this.jwtAccessTokenConverterSecret = jwtAccessTokenConverterSecret;
		}

		public String getOauthWebClientId() {
			return oauthWebClientId;
		}

		public void setOauthWebClientId(String oauthWebClientId) {
			this.oauthWebClientId = oauthWebClientId;
		}

		public String getOauthWebClientSecret() {
			return oauthWebClientSecret;
		}

		public void setOauthWebClientSecret(String oauthWebClientSecret) {
			this.oauthWebClientSecret = oauthWebClientSecret;
		}

		public String getOauthMobileClientId() {
			return oauthMobileClientId;
		}

		public void setOauthMobileClientId(String oauthMobileClientId) {
			this.oauthMobileClientId = oauthMobileClientId;
		}

		public String getOauthMobileClientSecret() {
			return oauthMobileClientSecret;
		}

		public void setOauthMobileClientSecret(String oauthMobileClientSecret) {
			this.oauthMobileClientSecret = oauthMobileClientSecret;
		}

	}

}
