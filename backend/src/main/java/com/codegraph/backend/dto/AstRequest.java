package com.codegraph.backend.dto;

public class AstRequest {
    private String code;
    private String language;

    // Constructors
    public AstRequest() {}
    public AstRequest(String code, String language) {
        this.code = code;
        this.language = language;
    }

    // Getters & Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
