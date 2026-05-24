package com.blasetvrtumi.rarecips.config;

import org.apache.catalina.connector.Connector;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("dev")
public class HttpConnectorConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpConnector() {
        return factory -> {
            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setScheme("http");
            connector.setPort(8080);
            connector.setSecure(false);
            factory.addAdditionalTomcatConnectors(connector);
        };
    }
}
