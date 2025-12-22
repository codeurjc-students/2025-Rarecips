package com.blasetvrtumi.rarecips.enums;

public enum MealType {
    BREAKFAST("Breakfast"),
    BRUNCH("Brunch"),
    LUNCH_DINNER("Lunch/Dinner"),
    SNACK("Snack"),
    TEATIME("Teatime"),
    DESSERT("Dessert"),
    APPETIZER("Appetizer"),
    BEVERAGE("Beverage");

    private final String displayName;

    MealType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static MealType fromDisplayName(String displayName) {
        for (MealType type : MealType.values()) {
            if (type.displayName.equalsIgnoreCase(displayName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid meal type: " + displayName);
    }
}
