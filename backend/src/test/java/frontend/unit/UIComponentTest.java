package frontend.unit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.controller.LandingController;
import com.blasetvrtumi.rarecips.service.RecipeService;
import com.blasetvrtumi.rarecips.entity.Recipe;

import java.util.List;
import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LandingController.class, excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class // Temporary sexurity disable
})
@ContextConfiguration(classes = RarecipsApplication.class)
public class UIComponentTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecipeService recipeService;

    @Test
    void shouldReturnRecipesForUIConsumption() throws Exception {
        List<Recipe> mockRecipes = new ArrayList<>();
        Recipe mockRecipe = new Recipe(
                "UI Test Recipe", "Description", new ArrayList<>(),
                new ArrayList<>(), new ArrayList<>(), 4, new ArrayList<>(),
                1, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(),
                30.0f, 500.0f, 400.0f, null, new ArrayList<>()
        );
        mockRecipes.add(mockRecipe);

        Page<Recipe> mockPage = new PageImpl<>(mockRecipes);

        when(recipeService.getRecipes(anyString(), anyInt(), anyInt())).thenReturn(mockPage);

        mockMvc.perform(get("/api/recipes")
                        .param("order", "lastmod")
                        .param("page", "0")
                        .param("size", "4")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.recipes").isArray())
                .andExpect(jsonPath("$.recipes[0].label").value("UI Test Recipe"));
    }
}