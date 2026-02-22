package com.blasetvrtumi.rarecips.enums;

public enum HealthLabel {
    ALCOHOL_COCKTAIL("Alcohol-Cocktail"),
    ALCOHOL_FREE("Alcohol-Free"),
    CELERY_FREE("Celery-Free"),
    CRUSTACEAN_FREE("Crustacean-Free"),
    DASH("DASH"),
    DAIRY_FREE("Dairy-Free"),
    EGG_FREE("Egg-Free"),
    FODMAP_FREE("FODMAP-Free"),
    FISH_FREE("Fish-Free"),
    GLUTEN_FREE("Gluten-Free"),
    IMMUNO_SUPPORTIVE("Immuno-Supportive"),
    KETO_FRIENDLY("Keto-Friendly"),
    KIDNEY_FRIENDLY("Kidney-Friendly"),
    KOSHER("Kosher"),
    LOW_POTASSIUM("Low Potassium"),
    LOW_SUGAR("Low Sugar"),
    LUPINE_FREE("Lupine-Free"),
    MEDITERRANEAN("Mediterranean"),
    MOLLUSK_FREE("Mollusk-Free"),
    MUSTARD_FREE("Mustard-Free"),
    NO_OIL_ADDED("No oil added"),
    PALEO("Paleo"),
    PEANUT_FREE("Peanut-Free"),
    PESCATARIAN("Pescatarian"),
    PORK_FREE("Pork-Free"),
    RED_MEAT_FREE("Red-Meat-Free"),
    SESAME_FREE("Sesame-Free"),
    SHELLFISH_FREE("Shellfish-Free"),
    SOY_FREE("Soy-Free"),
    SUGAR_CONSCIOUS("Sugar-Conscious"),
    SULFITE_FREE("Sulfite-Free"),
    TREE_NUT_FREE("Tree-Nut-Free"),
    VEGAN("Vegan"),
    VEGETARIAN("Vegetarian"),
    WHEAT_FREE("Wheat-Free");

    private final String displayName;

    HealthLabel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static HealthLabel fromDisplayName(String displayName) {
        for (HealthLabel label : HealthLabel.values()) {
            if (label.displayName.equalsIgnoreCase(displayName)) {
                return label;
            }
        }
        throw new IllegalArgumentException("Invalid health label: " + displayName);
    }
}
