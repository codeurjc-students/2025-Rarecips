package com.blasetvrtumi.rarecips.enums;

public enum CuisineType {
    AMERICAN("American"),
    ASIAN("Asian"),
    BRITISH("British"),
    CARIBBEAN("Caribbean"),
    CENTRAL_EUROPE("Central Europe"),
    CHINESE("Chinese"),
    EASTERN_EUROPE("Eastern Europe"),
    FRENCH("French"),
    INDIAN("Indian"),
    ITALIAN("Italian"),
    JAPANESE("Japanese"),
    LATIN_AMERICAN("Latin American"),
    MEDITERRANEAN("Mediterranean"),
    MEXICAN("Mexican"),
    MIDDLE_EASTERN("Middle Eastern"),
    NORDIC("Nordic"),
    SOUTH_AMERICAN("South American"),
    SOUTH_EAST_ASIAN("South East Asian"),
    SPANISH("Spanish"),
    WORLD("World");

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
