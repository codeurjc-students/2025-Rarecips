package com.blasetvrtumi.rarecips.enums;

public enum CuisineType {
    AMERICAN("american"),
    ASIAN("asian"),
    BRITISH("british"),
    CARIBBEAN("caribbean"),
    CENTRAL_EUROPE("central europe"),
    CHINESE("chinese"),
    CUBAN("cuban"),
    EASTERN_EUROPE("eastern europe"),
    FRENCH("french"),
    INDIAN("indian"),
    ITALIAN("italian"),
    JAPANESE("japanese"),
    MEDITERRANEAN("mediterranean"),
    MEXICAN("mexican"),
    MIDDLE_EASTERN("middle eastern"),
    NORDIC("nordic"),
    SOUTH_AMERICAN("south american"),
    SOUTH_EAST_ASIAN("south east asian"),
    WORLD("world");

    private final String displayName;

    CuisineType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static CuisineType fromDisplayName(String displayName) {
        for (CuisineType type : CuisineType.values()) {
            if (type.displayName.equalsIgnoreCase(displayName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid cuisine type: " + displayName);
    }
}
