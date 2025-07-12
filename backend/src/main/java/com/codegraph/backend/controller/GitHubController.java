package com.codegraph.backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/github")
public class GitHubController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String GITHUB_API_BASE = "https://api.github.com";

    // Fetch all user repositories
    @GetMapping("/repos")
    public ResponseEntity<Object> getUserRepos(@RequestHeader("Authorization") String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        String url = GITHUB_API_BASE + "/user/repos";

        ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
        return ResponseEntity.ok(response.getBody());
    }

    // Fetch contents of a repo path
    @GetMapping("/repo-content")
    public ResponseEntity<Object> getRepoContents(
            @RequestHeader("Authorization") String token,
            @RequestParam String owner,
            @RequestParam String repo,
            @RequestParam(required = false, defaultValue = "") String path
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = GITHUB_API_BASE + "/repos/" + owner + "/" + repo + "/contents/" + path;

        ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
        return ResponseEntity.ok(response.getBody());
    }

    // Fetch repo stats (commits & branches)
    @GetMapping("/repo-stats")
    public ResponseEntity<Map<String, Object>> getRepoStats(
            @RequestHeader("Authorization") String token,
            @RequestParam String owner,
            @RequestParam String repo
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        Map<String, Object> result = new HashMap<>();

        // Commits
        String commitsUrl = GITHUB_API_BASE + "/repos/" + owner + "/" + repo + "/commits";
        ResponseEntity<Object> commits = restTemplate.exchange(commitsUrl, HttpMethod.GET, entity, Object.class);
        result.put("commits", commits.getBody());

        // Branches
        String branchesUrl = GITHUB_API_BASE + "/repos/" + owner + "/" + repo + "/branches";
        ResponseEntity<Object> branches = restTemplate.exchange(branchesUrl, HttpMethod.GET, entity, Object.class);
        result.put("branches", branches.getBody());

        return ResponseEntity.ok(result);
    }
}
