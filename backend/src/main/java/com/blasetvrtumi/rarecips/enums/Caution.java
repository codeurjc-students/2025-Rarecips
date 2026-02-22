package com.blasetvrtumi.rarecips.enums;

public enum Caution {
    EGGS("Eggs"),
    FODMAP("FODMAP"),
    GLUTEN("Gluten"),
    MILK("Milk"),
    SOY("Soy"),
    SULFITES("Sulfites"),
    TREE_NUTS("Tree-Nuts"),
    WHEAT("Wheat");

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
