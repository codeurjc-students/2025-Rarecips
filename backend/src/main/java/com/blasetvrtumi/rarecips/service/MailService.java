package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Recipe;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.samskivert.mustache.Mustache;
import com.samskivert.mustache.Template;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class MailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private RecipeService recipeService;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendChangePasswordEmail(String to, String token, String baseUrl, String lang, String theme, String username, String passwordChangeLink) {
        try {
            ClassPathResource resource = new ClassPathResource("templates/passwordchange_mail_template.mustache");
            String template;
        
            try (InputStream inputStream = resource.getInputStream()) {
                template = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            }

            Map<String, String> themeVars = getThemeVars(theme);
            Map<String, String> translations = getTranslatedStrings(lang, "passwordchange", username);
            Map<String, Object> context = new HashMap<>();
            String subject = translations.getOrDefault("subject", "Change your password on Rarecips");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            context.putAll(translations);
            context.putAll(themeVars);
            context.put("baseUrl", baseUrl);
            context.put("token", token);
            context.put("subject", subject);
            context.put("username", username);
            context.put("passwordChangeLink", passwordChangeLink);
            context.put("timestamp", timestamp);

            Template mustache = Mustache.compiler().escapeHTML(false).compile(template);
            String html = mustache.execute(context);
            sendHtmlEmail(to, subject, html);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
    public void sendWelcomeEmail(String to, String baseUrl, String language, String theme, String username) {
        try {

            ClassPathResource resource = new ClassPathResource("templates/welcome_mail_template.mustache");
            String template;
        
            try (InputStream inputStream = resource.getInputStream()) {
                template = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            }

            Map<String, String> translations = getTranslatedStrings(language, "welcome", username);
            Map<String, String> themeVars = getThemeVars(theme);
            List<Recipe> recipes = recipeService.getRecipes("updatedAt", 3, 0).getContent();
            String subject = translations.getOrDefault("subject", "¡Welcome to Rarecips!");

            Map<String, Object> context = new HashMap<>();
            context.put("username", username);
            context.putAll(translations);
            context.putAll(themeVars);
            context.put("baseUrl", baseUrl);
            context.put("subject", subject);
            context.put("username", username);
            context.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            context.put("fromAddress", fromAddress);

            List<Map<String, String>> recipeList = new ArrayList<>();
            for (Recipe recipe : recipes) {
                Map<String, String> r = new HashMap<>();
                r.put("id", recipe.getId().toString());
                r.put("label", recipe.getLabel());

                r.put("imageString", "https://www.edamam.com/food-img/e31/e310952d214e78a4cb8b73f30ceeaaf2.jpg"); //TODO: minio hosted images
                recipeList.add(r);
            }
            context.put("recipes", recipeList);
            Template mustache = Mustache.compiler().escapeHTML(false).compile(template);

            String html = mustache.execute(context);
            sendHtmlEmail(to, subject, html);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendUserSuspendedEmail(String to, String baseUrl, String lang, String theme, String username) {
        try {
            ClassPathResource resource = new ClassPathResource("templates/user_suspended_mail_template.mustache");
            String template;

            try (InputStream inputStream = resource.getInputStream()) {
                template = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            }

            Map<String, String> themeVars = getThemeVars(theme);
            Map<String, String> translations = getTranslatedStrings(lang, "usersuspended", username);
            Map<String, Object> context = new HashMap<>();
            String subject = translations.getOrDefault("subject", "Your Rarecips account has been suspended");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            context.putAll(translations);
            context.putAll(themeVars);
            context.put("baseUrl", baseUrl);
            context.put("subject", subject);
            context.put("username", username);
            context.put("timestamp", timestamp);
            context.put("fromAddress", fromAddress);

            Template mustache = Mustache.compiler().escapeHTML(false).compile(template);
            String html = mustache.execute(context);
            sendHtmlEmail(to, subject, html);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send user suspended email", e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String html) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private String loadTemplate(String filename) throws IOException {
        ClassPathResource resource = new ClassPathResource("templates/" + filename);
        byte[] bytes = Files.readAllBytes(resource.getFile().toPath());
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private Map<String, String> getTranslatedStrings(String lang, String mailType, String username) {
        Map<String, String> translations = new HashMap<>();
        String l = lang == null ? "en" : lang.toLowerCase(Locale.ROOT);
        if ("welcome".equals(mailType)) {
            switch (l) {
                case "es":
                    translations.put("subject", "¡Bienvenido a Rarecips, " + username + "!");
                    translations.put("welcome_mail_title", "¡Bienvenido a Rarecips!");
                    translations.put("welcome_mail_intro", "Echa un vistazo a las recetas más recientes y comienza tu aventura culinaria 🍽️");
                    translations.put("welcome_mail_thank_you", "Gracias por unirte a Rarecips. ¡Feliz cocina!");
                    translations.put("welcome_mail_contact", "Para cualquier consulta, contáctanos en");
                    break;
                case "fr":
                    translations.put("subject", "Bienvenue sur Rarecips, " + username + "!");
                    translations.put("welcome_mail_title", "Bienvenue sur Rarecips !");
                    translations.put("welcome_mail_intro", "Découvrez les dernières recettes et commencez votre aventure culinaire 🍽️");
                    translations.put("welcome_mail_thank_you", "Merci de rejoindre Rarecips. Bonne cuisine !");
                    translations.put("welcome_mail_contact", "Pour toute question, contactez-nous à");
                    break;
                case "ja":
                    translations.put("subject", "Rarecipsへようこそ、 " + username + "さん！");
                    translations.put("welcome_mail_title", "Rarecipsへようこそ！");
                    translations.put("welcome_mail_intro", "最新のレシピをチェックして、料理の冒険を始めましょう 🍽️");
                    translations.put("welcome_mail_thank_you", "Rarecipsにご参加いただきありがとうございます。楽しい料理を！");
                    translations.put("welcome_mail_contact", "ご質問がある場合は、こちらまでご連絡ください：");
                    break;
                case "zh":
                    translations.put("subject", "欢迎来到Rarecips, " + username + "！");
                    translations.put("welcome_mail_title", "欢迎来到 Rarecips！");
                    translations.put("welcome_mail_intro", "看看最新的食谱，开启你的美食之旅 🍽️");
                    translations.put("welcome_mail_thank_you", "感谢您加入 Rarecips。祝您烹饪愉快！");
                    translations.put("welcome_mail_contact", "如有任何疑问，请联系我们：");
                    break;
                default:
                    translations.put("subject", "Welcome to Rarecips, " + username + "!");
                    translations.put("welcome_mail_title", "Welcome to Rarecips!");
                    translations.put("welcome_mail_intro", "Take a look at the newest recipes and start your culinary adventure 🍽️");
                    translations.put("welcome_mail_thank_you", "Thank you for joining Rarecips. Happy cooking!");
                    translations.put("welcome_mail_contact", "For any inquiries, contact us at");
            }
        } else if ("passwordchange".equals(mailType)) {
            switch (l) {
                case "es":
                    translations.put("subject", "Cambia tu contraseña en Rarecips");
                    translations.put("hey_user_password_change", "Hola " + username + ", has solicitado un cambio de contraseña. Puedes hacer clic en el enlace de arriba o copiarlo y pegarlo en tu navegador preferido");
                    translations.put("change_password_button", "Cambiar contraseña");
                    translations.put("or", "o");
                    translations.put("password_change_link_label", "Enlace para cambiar contraseña");
                    translations.put("ignore_text", "Si no has solicitado esto, contáctanos lo antes posible en esta misma dirección.");
                    break;
                case "fr":
                    translations.put("subject", "Changez votre mot de passe sur Rarecips");
                    translations.put("hey_user_password_change", "Salut " + username + ", vous avez demandé un changement de mot de passe. Vous pouvez cliquer sur le lien ci-dessus ou le copier-coller dans votre navigateur préféré");
                    translations.put("change_password_button", "Changer le mot de passe");
                    translations.put("or", "ou");
                    translations.put("password_change_link_label", "Lien de changement de mot de passe");
                    translations.put("ignore_text", "Si vous n'avez pas demandé cela, contactez-nous dès que possible à cette adresse.");
                    break;
                case "ja":
                    translations.put("subject", "Rarecipsのパスワードを変更");
                    translations.put("hey_user_password_change", "こんにちは " + username + "さん、パスワードの変更がリクエストされました。上記のリンクをクリックするか、ブラウザにコピー＆ペーストしてください");
                    translations.put("change_password_button", "パスワードを変更する");
                    translations.put("or", "または");
                    translations.put("password_change_link_label", "パスワード変更リンク");
                    translations.put("ignore_text", "このリクエストに心当たりがない場合は、このアドレスまでご連絡ください。");
                    break;
                case "zh":
                    translations.put("subject", "更改您的Rarecips密码");
                    translations.put("hey_user_password_change", "你好 " + username + "，您已请求更改密码。您可以点击上方的链接，或将其复制粘贴到您喜欢的浏览器中");
                    translations.put("change_password_button", "更改密码");
                    translations.put("or", "或");
                    translations.put("password_change_link_label", "更改密码链接");
                    translations.put("ignore_text", "如果您没有请求此操作，请尽快通过此地址联系我们。");
                    break;
                default:
                    translations.put("subject", "Change your password on Rarecips");
                    translations.put("hey_user_password_change", "Hey " + username + ", you requested a password change. You can click on the link above to do so, or alternatively copy and paste the link in your preferred browser");
                    translations.put("change_password_button", "Change Password");
                    translations.put("or", "or");
                    translations.put("password_change_link_label", "Change Password Link");
                    translations.put("ignore_text", "If you didn't request this, contact us as soon as possible at this very address.");
                    break;
            }
        } else if ("usersuspended".equals(mailType)) {
            switch (l) {
                case "es":
                    translations.put("subject", "Tu cuenta de Rarecips ha sido suspendida");
                    translations.put("suspension_title", "Cuenta suspendida temporalmente");
                    translations.put("suspension_message", "Hola " + username + ", un administrador ha suspendido temporalmente tu cuenta por incumplir las normas de la plataforma.");
                    translations.put("suspension_next_steps", "Si crees que ha sido un error, puedes contactar con soporte para revisarlo.");
                    translations.put("contact_label", "Contacto de soporte");
                    break;
                case "fr":
                    translations.put("subject", "Votre compte Rarecips a été suspendu");
                    translations.put("suspension_title", "Compte temporairement suspendu");
                    translations.put("suspension_message", "Bonjour " + username + ", un administrateur a temporairement suspendu votre compte pour non-respect des règles de la plateforme.");
                    translations.put("suspension_next_steps", "Si vous pensez qu'il s'agit d'une erreur, contactez le support pour révision.");
                    translations.put("contact_label", "Contact support");
                    break;
                case "ja":
                    translations.put("subject", "Rarecipsアカウントが停止されました");
                    translations.put("suspension_title", "アカウントが一時停止されました");
                    translations.put("suspension_message", "こんにちは " + username + " さん、プラットフォーム規約違反により管理者があなたのアカウントを一時停止しました。");
                    translations.put("suspension_next_steps", "誤りだと思われる場合は、サポートまでご連絡ください。確認いたします。");
                    translations.put("contact_label", "サポート連絡先");
                    break;
                case "zh":
                    translations.put("subject", "您的 Rarecips 账户已被暂停");
                    translations.put("suspension_title", "账户已被临时暂停");
                    translations.put("suspension_message", "您好 " + username + "，由于违反平台规则，管理员已临时暂停您的账户。");
                    translations.put("suspension_next_steps", "如果您认为这是误判，请联系支持团队进行复核。");
                    translations.put("contact_label", "支持联系方式");
                    break;
                default:
                    translations.put("subject", "Your Rarecips account has been suspended");
                    translations.put("suspension_title", "Account temporarily suspended");
                    translations.put("suspension_message", "Hi " + username + ", an administrator has temporarily suspended your account for violating platform rules.");
                    translations.put("suspension_next_steps", "If you think this is a mistake, contact support and we will review it.");
                    translations.put("contact_label", "Support contact");
                    break;
            }
        }
        return translations;
    }

    private Map<String, String> getThemeVars(String theme) {

        Map<String, Map<String, String>> themes = new HashMap<>();
        HashMap<String, String> tangerineLight = new HashMap<>();
        tangerineLight.put("primary_10", "#fffaf6");
        tangerineLight.put("primary_50", "#fff6ec");
        tangerineLight.put("primary_100", "#ffebd3");
        tangerineLight.put("primary_100_40", "rgba(255, 235, 211, 0.4)");
        tangerineLight.put("primary_200", "#ffd3a7");
        tangerineLight.put("primary_200_40", "rgba(255, 211, 167, 0.4)");
        tangerineLight.put("primary_300", "#ffb37a");
        tangerineLight.put("primary_300_40", "rgba(255, 179, 122, 0.4)");
        tangerineLight.put("primary_400", "#ff8f4d");
        tangerineLight.put("primary_500", "#ff680e");
        tangerineLight.put("primary_600", "#f14b04");
        tangerineLight.put("primary_700", "#c93605");
        tangerineLight.put("primary_text", "#6c1909");
        tangerineLight.put("gradient_primary", "linear-gradient(135deg, #ff680e, #f14b04)");
        tangerineLight.put("glass_border", "rgba(255, 235, 211, 0.4)");
        themes.put("theme-tangerine-light", tangerineLight);
        // tangerine-dark
        HashMap<String, String> tangerineDark = new HashMap<>();
        tangerineDark.put("primary_10", "#1a0e08");
        tangerineDark.put("primary_50", "#2d1610");
        tangerineDark.put("primary_100", "#442318");
        tangerineDark.put("primary_100_40", "rgba(68, 35, 24, 0.4)");
        tangerineDark.put("primary_200", "#5c3020");
        tangerineDark.put("primary_200_40", "rgba(92, 48, 32, 0.4)");
        tangerineDark.put("primary_300", "#744228");
        tangerineDark.put("primary_300_40", "rgba(116, 66, 40, 0.4)");
        tangerineDark.put("primary_400", "#8c5530");
        tangerineDark.put("primary_500", "#ff8a50");
        tangerineDark.put("primary_600", "#ff9d66");
        tangerineDark.put("primary_700", "#ffb080");
        tangerineDark.put("primary_text", "#ffddcc");
        tangerineDark.put("gradient_primary", "linear-gradient(135deg, #ff8a50, #ff9d66)");
        tangerineDark.put("glass_border", "rgba(68, 35, 24, 0.4)");
        themes.put("theme-tangerine-dark", tangerineDark);
        // ocean-light
        HashMap<String, String> oceanLight = new HashMap<>();
        oceanLight.put("primary_10", "#f6feff");
        oceanLight.put("primary_50", "#e0f7fa");
        oceanLight.put("primary_100", "#b2ebf2");
        oceanLight.put("primary_100_40", "rgba(178, 235, 242, 0.4)");
        oceanLight.put("primary_200", "#80deea");
        oceanLight.put("primary_200_40", "rgba(128, 222, 234, 0.4)");
        oceanLight.put("primary_300", "#4dd0e1");
        oceanLight.put("primary_300_40", "rgba(77, 208, 225, 0.4)");
        oceanLight.put("primary_400", "#26c6da");
        oceanLight.put("primary_500", "#00bcd4");
        oceanLight.put("primary_600", "#00acc1");
        oceanLight.put("primary_700", "#0097a7");
        oceanLight.put("primary_text", "#002f33");
        oceanLight.put("gradient_primary", "linear-gradient(135deg, #00bcd4, #00acc1)");
        oceanLight.put("glass_border", "rgba(178, 235, 242, 0.4)");
        themes.put("theme-ocean-light", oceanLight);
        // ocean-dark
        HashMap<String, String> oceanDark = new HashMap<>();
        oceanDark.put("primary_10", "#0a1215");
        oceanDark.put("primary_50", "#0f1f24");
        oceanDark.put("primary_100", "#1a3338");
        oceanDark.put("primary_100_40", "rgba(26, 51, 56, 0.4)");
        oceanDark.put("primary_200", "#244750");
        oceanDark.put("primary_200_40", "rgba(36, 71, 80, 0.4)");
        oceanDark.put("primary_300", "#2e5b68");
        oceanDark.put("primary_300_40", "rgba(46, 91, 104, 0.4)");
        oceanDark.put("primary_400", "#3a7080");
        oceanDark.put("primary_500", "#4dd0e1");
        oceanDark.put("primary_600", "#66d9e8");
        oceanDark.put("primary_700", "#80e2ef");
        oceanDark.put("primary_text", "#b3f0f7");
        oceanDark.put("gradient_primary", "linear-gradient(135deg, #4dd0e1, #66d9e8)");
        oceanDark.put("glass_border", "rgba(26, 51, 56, 0.4)");
        themes.put("theme-ocean-dark", oceanDark);
        // forest-light
        HashMap<String, String> forestLight = new HashMap<>();
        forestLight.put("primary_10", "#f7fcf8");
        forestLight.put("primary_50", "#e8f5e9");
        forestLight.put("primary_100", "#c8e6c9");
        forestLight.put("primary_100_40", "rgba(200, 230, 201, 0.4)");
        forestLight.put("primary_200", "#a5d6a7");
        forestLight.put("primary_200_40", "rgba(165, 214, 167, 0.4)");
        forestLight.put("primary_300", "#81c784");
        forestLight.put("primary_300_40", "rgba(129, 199, 132, 0.4)");
        forestLight.put("primary_400", "#66bb6a");
        forestLight.put("primary_500", "#4caf50");
        forestLight.put("primary_600", "#43a047");
        forestLight.put("primary_700", "#388e3c");
        forestLight.put("primary_text", "#0d2e09");
        forestLight.put("gradient_primary", "linear-gradient(135deg, #4caf50, #43a047)");
        forestLight.put("glass_border", "rgba(200, 230, 201, 0.4)");
        themes.put("theme-forest-light", forestLight);
        // forest-dark
        HashMap<String, String> forestDark = new HashMap<>();
        forestDark.put("primary_10", "#0a1408");
        forestDark.put("primary_50", "#142510");
        forestDark.put("primary_100", "#1e3718");
        forestDark.put("primary_100_40", "rgba(30, 55, 24, 0.4)");
        forestDark.put("primary_200", "#284920");
        forestDark.put("primary_200_40", "rgba(40, 73, 32, 0.4)");
        forestDark.put("primary_300", "#325b28");
        forestDark.put("primary_300_40", "rgba(50, 91, 40, 0.4)");
        forestDark.put("primary_400", "#3d6e30");
        forestDark.put("primary_500", "#66bb6a");
        forestDark.put("primary_600", "#81c784");
        forestDark.put("primary_700", "#9ccc9e");
        forestDark.put("primary_text", "#c8e6c9");
        forestDark.put("gradient_primary", "linear-gradient(135deg, #66bb6a, #81c784)");
        forestDark.put("glass_border", "rgba(30, 55, 24, 0.4)");
        themes.put("theme-forest-dark", forestDark);
        // rose-light
        HashMap<String, String> roseLight = new HashMap<>();
        roseLight.put("primary_10", "#fff7f8");
        roseLight.put("primary_50", "#fff1f2");
        roseLight.put("primary_100", "#ffe4e6");
        roseLight.put("primary_100_40", "rgba(255, 228, 230, 0.4)");
        roseLight.put("primary_200", "#fecdd3");
        roseLight.put("primary_200_40", "rgba(255, 205, 211, 0.4)");
        roseLight.put("primary_300", "#fda4af");
        roseLight.put("primary_300_40", "rgba(253, 164, 175, 0.4)");
        roseLight.put("primary_400", "#fb7185");
        roseLight.put("primary_500", "#f43f5e");
        roseLight.put("primary_600", "#e11d48");
        roseLight.put("primary_700", "#be123c");
        roseLight.put("primary_text", "#3b0a0f");
        roseLight.put("gradient_primary", "linear-gradient(135deg, #f43f5e, #e11d48)");
        roseLight.put("glass_border", "rgba(255, 228, 230, 0.4)");
        themes.put("theme-rose-light", roseLight);
        // rose-dark
        HashMap<String, String> roseDark = new HashMap<>();
        roseDark.put("primary_10", "#1a0a0f");
        roseDark.put("primary_50", "#2d1419");
        roseDark.put("primary_100", "#441e27");
        roseDark.put("primary_100_40", "rgba(68, 30, 39, 0.4)");
        roseDark.put("primary_200", "#5c2835");
        roseDark.put("primary_200_40", "rgba(92, 40, 53, 0.4)");
        roseDark.put("primary_300", "#743243");
        roseDark.put("primary_300_40", "rgba(116, 50, 67, 0.4)");
        roseDark.put("primary_400", "#8c3c51");
        roseDark.put("primary_500", "#fb7185");
        roseDark.put("primary_600", "#fda4af");
        roseDark.put("primary_700", "#fecdd3");
        roseDark.put("primary_text", "#ffe4e6");
        roseDark.put("gradient_primary", "linear-gradient(135deg, #fb7185, #fda4af)");
        roseDark.put("glass_border", "rgba(68, 30, 39, 0.4)");
        themes.put("theme-rose-dark", roseDark);
        // neutral-light
        HashMap<String, String> neutralLight = new HashMap<>();
        neutralLight.put("primary_10", "#f8fae9");
        neutralLight.put("primary_50", "#f8fafc");
        neutralLight.put("primary_100", "#f1f5f9");
        neutralLight.put("primary_100_40", "rgba(241, 245, 249, 0.4)");
        neutralLight.put("primary_200", "#e2e8f0");
        neutralLight.put("primary_200_40", "rgba(226, 232, 240, 0.4)");
        neutralLight.put("primary_300", "#cbd5e1");
        neutralLight.put("primary_300_40", "rgba(203, 213, 225, 0.4)");
        neutralLight.put("primary_400", "#94a3b8");
        neutralLight.put("primary_500", "#64748b");
        neutralLight.put("primary_600", "#475569");
        neutralLight.put("primary_700", "#334155");
        neutralLight.put("primary_text", "#02071a");
        neutralLight.put("gradient_primary", "linear-gradient(135deg, #64748b, #475569)");
        neutralLight.put("glass_border", "rgba(241, 245, 249, 0.4)");
        themes.put("theme-neutral-light", neutralLight);
        // neutral-dark
        HashMap<String, String> neutralDark = new HashMap<>();
        neutralDark.put("primary_10", "#0a0a0b");
        neutralDark.put("primary_50", "#18181b");
        neutralDark.put("primary_100", "#27272a");
        neutralDark.put("primary_100_40", "rgba(39, 39, 42, 0.4)");
        neutralDark.put("primary_200", "#3f3f46");
        neutralDark.put("primary_200_40", "rgba(63, 63, 70, 0.4)");
        neutralDark.put("primary_300", "#52525b");
        neutralDark.put("primary_300_40", "rgba(82, 82, 91, 0.4)");
        neutralDark.put("primary_400", "#71717a");
        neutralDark.put("primary_500", "#a1a1aa");
        neutralDark.put("primary_600", "#d4d4d8");
        neutralDark.put("primary_700", "#e4e4e7");
        neutralDark.put("primary_text", "#f4f4f5");
        neutralDark.put("gradient_primary", "linear-gradient(135deg, #a1a1aa, #d4d4d8)");
        neutralDark.put("glass_border", "rgba(39, 39, 42, 0.4)");
        themes.put("theme-neutral-dark", neutralDark);

        return themes.getOrDefault(theme, themes.get("theme-tangerine-light"));
    }
}

