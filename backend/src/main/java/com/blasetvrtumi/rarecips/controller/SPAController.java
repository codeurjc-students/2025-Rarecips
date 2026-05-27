package com.blasetvrtumi.rarecips.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.util.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import jakarta.servlet.http.HttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;

@Controller
public class SPAController {

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    // Redirect all frontend paths to index.html for angular router to handle manually
    @GetMapping("/{path:^(?!assets|media|api|v3|swagger-ui|notify)[^.]*}/**")
    public String redirect() {
        return "forward:/index.html";
    }

    private String getIndexHtml() throws Exception {
        Resource resource = resourceLoader.getResource("classpath:/static/index.html");
        if (!resource.exists()) {
            resource = resourceLoader.getResource("classpath:/public/index.html");
        }
        return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
    }

    private String getBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        if ((scheme.equals("http") && serverPort == 80) || (scheme.equals("https") && serverPort == 443)) {
            return scheme + "://" + serverName;
        }
        return scheme + "://" + serverName + ":" + serverPort;
    }

    private String getTranslatedRecipeTitle(String lang) {
        if (lang.startsWith("es")) return "Receta en Rarecips";
        if (lang.startsWith("fr")) return "Recette dans Rarecips";
        if (lang.startsWith("ja")) return "Rarecipsのレシピ";
        if (lang.startsWith("zh")) return "Rarecips中的食谱";
        return "Recipe in Rarecips";
    }

    private String getTranslatedRecipeDesc(String lang) {
        if (lang.startsWith("es")) return "Mira esta deliciosa receta en Rarecips";
        if (lang.startsWith("fr")) return "Découvrez cette délicieuse recette sur Rarecips";
        if (lang.startsWith("ja")) return "Rarecipsでこの美味しいレシピをチェックしてください";
        if (lang.startsWith("zh")) return "在Rarecips上查看这个美味的食谱";
        return "Check out this delicious recipe on Rarecips";
    }

    private String getTranslatedUserDesc(String lang, String title) {
        if (lang.startsWith("es")) return "Mira el perfil de " + title + " en Rarecips";
        if (lang.startsWith("fr")) return "Découvrez le profil de " + title + " sur Rarecips";
        if (lang.startsWith("ja")) return "Rarecipsで" + title + "のプロフィールをチェックしてください";
        if (lang.startsWith("zh")) return "在Rarecips上查看" + title + "的个人资料";
        return "Check out the profile of " + title + " on Rarecips";
    }

    private String extractLanguage(HttpServletRequest request) {
        String acceptLanguage = request.getHeader("Accept-Language");
        if (acceptLanguage != null && acceptLanguage.length() >= 2) {
            return acceptLanguage.substring(0, 2).toLowerCase();
        }
        return "en";
    }

    @GetMapping(value = "/recipes/{id}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String getRecipeOG(@PathVariable Long id, HttpServletRequest request) {
        try {
            String html = getIndexHtml();
            Optional<Recipe> recipeOpt = recipeRepository.findById(id);
            if (recipeOpt.isPresent()) {
                String lang = extractLanguage(request);
                Recipe recipe = recipeOpt.get();
                String title = recipe.getLabel() != null ? recipe.getLabel().replace("\"", "&quot;") : getTranslatedRecipeTitle(lang);
                String description = recipe.getDescription() != null ? recipe.getDescription().replace("\"", "&quot;") : getTranslatedRecipeDesc(lang);
                String baseUrl = getBaseUrl(request);
                String imageUrl = baseUrl + "/assets/img/recipe.png";

                String ogTags = "<meta property=\"og:title\" content=\"" + title + "\">\n" +
                                "<meta property=\"og:description\" content=\"" + description + "\">\n" +
                                "<meta property=\"og:image\" content=\"" + imageUrl + "\">\n" +
                                "<meta property=\"twitter:card\" content=\"summary_large_image\">\n";
                return html.replace("</head>", ogTags + "</head>");
            }
            return html;
        } catch (Exception e) {
            return "forward:/index.html";
        }
    }

    @GetMapping(value = "/users/{username}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String getUserOG(@PathVariable String username, HttpServletRequest request) {
        try {
            String html = getIndexHtml();
            User user = userRepository.findByUsername(username);
            if (user != null) {
                String lang = extractLanguage(request);
                String title = (user.getDisplayName() != null ? user.getDisplayName() : user.getUsername()).replace("\"", "&quot;");
                String description = user.getBio() != null ? user.getBio().replace("\"", "&quot;") : getTranslatedUserDesc(lang, title);
                String baseUrl = getBaseUrl(request);
                String imageUrl = baseUrl + "/assets/img/user.png";

                String ogTags = "<meta property=\"og:title\" content=\"" + title + "\">\n" +
                                "<meta property=\"og:description\" content=\"" + description + "\">\n" +
                                "<meta property=\"og:image\" content=\"" + imageUrl + "\">\n" +
                                "<meta property=\"twitter:card\" content=\"summary_large_image\">\n";
                return html.replace("</head>", ogTags + "</head>");
            }
            return html;
        } catch (Exception e) {
            return "forward:/index.html";
        }
    }

}
