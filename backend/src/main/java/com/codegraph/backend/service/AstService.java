package com.codegraph.backend.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AstService {

    private final String AST_API_URL = "http://localhost:3000/parse";

    public String getAst(String code, String language) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> payload = Map.of(
                "code", code,
                "language", language
        );

        HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(AST_API_URL, request, String.class);
            return response.getBody(); // ← this is your AST JSON!
        } catch (Exception e) {
            return "{\"error\": \"Failed to connect to AST service\"}";
        }
    }
}
