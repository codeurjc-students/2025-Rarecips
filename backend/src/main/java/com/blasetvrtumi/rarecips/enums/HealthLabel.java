package com.blasetvrtumi.rarecips.enums;

public enum HealthLabel {
    VEGAN("Vegan"),
    VEGETARIAN("Vegetarian"),
    PALEO("Paleo"),
    DAIRY_FREE("Dairy-Free"),
    GLUTEN_FREE("Gluten-Free"),
    WHEAT_FREE("Wheat-Free"),
    EGG_FREE("Egg-Free"),
    PEANUT_FREE("Peanut-Free"),
    TREE_NUT_FREE("Tree-Nut-Free"),
    SOY_FREE("Soy-Free"),
    FISH_FREE("Fish-Free"),
    SHELLFISH_FREE("Shellfish-Free"),
    PORK_FREE("Pork-Free"),
    RED_MEAT_FREE("Red-Meat-Free"),
    CRUSTACEAN_FREE("Crustacean-Free"),
    CELERY_FREE("Celery-Free"),
    MUSTARD_FREE("Mustard-Free"),
    SESAME_FREE("Sesame-Free"),
    LUPINE_FREE("Lupine-Free"),
    MOLLUSK_FREE("Mollusk-Free"),
    ALCOHOL_FREE("Alcohol-Free"),
    NO_OIL_ADDED("No oil added"),
    SULFITE_FREE("Sulfite-Free"),
    FODMAP_FREE("FODMAP-Free"),
    KOSHER("Kosher"),
    IMMUNO_SUPPORTIVE("Immuno-Supportive");

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
