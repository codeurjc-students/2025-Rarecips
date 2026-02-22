package com.blasetvrtumi.rarecips.enums;

public enum MealType {
    LUNCH_DINNER("Lunch/Dinner"),
    BREAKFAST("breakfast"),
    BRUNCH("brunch"),
    SNACK("snack"),
    TEATIME("teatime");

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
