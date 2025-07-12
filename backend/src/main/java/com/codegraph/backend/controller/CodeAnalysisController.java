package com.codegraph.backend.controller;

import com.codegraph.backend.dto.AstRequest;
import com.codegraph.backend.service.AstService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ast")
public class CodeAnalysisController {

    @Autowired
    private AstService astService;

    @PostMapping
    public String getAst(@RequestBody AstRequest request) {
        return astService.getAst(request.getCode(), request.getLanguage());
    }
}
