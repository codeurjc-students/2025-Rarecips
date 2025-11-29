package com.blasetvrtumi.rarecips.enums;

public enum Caution {
    SULFITES("Sulfites"),
    TREE_NUTS("Tree-Nuts"),
    SHELLFISH("Shellfish"),
    PEANUTS("Peanuts"),
    GLUTEN("Gluten"),
    DAIRY("Dairy"),
    EGGS("Eggs"),
    SOY("Soy"),
    WHEAT("Wheat"),
    FISH("Fish"),
    FODMAP("FODMAP");

    private final String displayName;

    Caution(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Caution fromDisplayName(String displayName) {
        for (Caution caution : Caution.values()) {
            if (caution.displayName.equalsIgnoreCase(displayName)) {
                return caution;
            }
        }
        throw new IllegalArgumentException("Invalid caution: " + displayName);
    }
}
