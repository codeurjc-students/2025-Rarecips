package com.blasetvrtumi.rarecips.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SPAController {

    // Redirect all frontend paths to index.html for angular router to handle manually
    @GetMapping("/{path:^(?!assets|media|api|v3|swagger-ui)[^.]*}/**")
    public String redirect() {
        return "forward:/index.html";
    }

}
