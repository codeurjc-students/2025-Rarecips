package com.blasetvrtumi.rarecips.enums;

public enum DifficultyLevel {
    VERY_EASY("Very Easy", 1),
    EASY("Easy", 2),
    MEDIUM("Medium", 3),
    HARD("Hard", 4),
    VERY_HARD("Very Hard", 5);

    private final String displayName;
    private final int value;

    DifficultyLevel(String displayName, int value) {
        this.displayName = displayName;
        this.value = value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getValue() {
        return value;
    }

    public static DifficultyLevel fromValue(int value) {
        for (DifficultyLevel level : DifficultyLevel.values()) {
            if (level.value == value) {
                return level;
            }
        }
        throw new IllegalArgumentException("Invalid difficulty level: " + value);
    }

    public static DifficultyLevel fromDisplayName(String displayName) {
        for (DifficultyLevel level : DifficultyLevel.values()) {
            if (level.displayName.equalsIgnoreCase(displayName)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Invalid difficulty level: " + displayName);
    }
}
