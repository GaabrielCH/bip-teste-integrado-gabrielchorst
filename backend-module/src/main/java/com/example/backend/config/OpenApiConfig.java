package com.example.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BIP Beneficios API")
                        .description("API REST para gerenciamento de beneficios com suporte a transferencias atomicas")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("BIP")
                                .email("dev@bip.com"))
                        .license(new License()
                                .name("MIT")));
    }
}
