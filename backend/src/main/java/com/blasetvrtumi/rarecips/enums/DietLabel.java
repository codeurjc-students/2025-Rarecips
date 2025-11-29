package com.blasetvrtumi.rarecips.enums;

public enum DietLabel {
    BALANCED("Balanced"),
    HIGH_FIBER("High-Fiber"),
    HIGH_PROTEIN("High-Protein"),
    LOW_CARB("Low-Carb"),
    LOW_FAT("Low-Fat"),
    LOW_SODIUM("Low-Sodium");

    private final String displayName;

    DietLabel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static DietLabel fromDisplayName(String displayName) {
        for (DietLabel label : DietLabel.values()) {
            if (label.displayName.equalsIgnoreCase(displayName)) {
                return label;
            }
        }
        throw new IllegalArgumentException("Invalid diet label: " + displayName);
    }
}
