package backend.unit;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.blasetvrtumi.rarecips.controller.RecipeController;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.service.ActivityService;
import com.blasetvrtumi.rarecips.service.ImageService;
import com.blasetvrtumi.rarecips.service.RecipeService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import com.blasetvrtumi.rarecips.enums.RecipeStatus;

@ExtendWith(MockitoExtension.class)
public class RecipeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RecipeService recipeService;

    @Mock
    private ImageService imageService;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private UserService userService;

    @Mock
    private ActivityService activityService;

    @InjectMocks
    private RecipeController recipeController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(recipeController).build();
    }

    @Test
    public void shouldGetRecipeById() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setLabel("Test Recipe");
        recipe.setPendingReview(false);

        when(recipeService.findById(1L)).thenReturn(recipe);

        mockMvc.perform(get("/api/v1/recipes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipe.label", is("Test Recipe")));
    }

    @Test
    public void shouldReturnNotFoundWhenRecipeDoesNotExist() throws Exception {
        when(recipeService.findById(99L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/recipes/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void shouldGetPendingRecipes_AsAdmin() throws Exception {
        User admin = new User();
        admin.setRole("ADMIN");
        admin.setUsername("admin");

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin");
        when(auth.isAuthenticated()).thenReturn(true);
        when(userService.findByUsername("admin")).thenReturn(admin);

        Page<Recipe> page = new PageImpl<>(java.util.Collections.emptyList());
        when(recipeRepository.findByPendingReviewTrue(org.mockito.ArgumentMatchers.any(Pageable.class))).thenReturn(page);
        mockMvc.perform(get("/api/v1/recipes/pending").principal(auth))
                .andExpect(status().isOk());
    }

    @Test
    public void shouldApproveRecipe_AsAdmin() throws Exception {
        User admin = new User();
        admin.setRole("ADMIN");
        admin.setUsername("admin");

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin");
        when(auth.isAuthenticated()).thenReturn(true);
        when(userService.findByUsername("admin")).thenReturn(admin);

        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setPendingReview(true);
        when(recipeService.findById(1L)).thenReturn(recipe);

        mockMvc.perform(put("/api/v1/recipes/1/status")
                .param("action", "approve")
                .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("approved")));
        
        verify(recipeRepository).save(recipe);
    }
}
