package com.blasetvrtumi.rarecips.enums;

public enum DishType {
    STARTER("Starter"),
    MAIN_COURSE("Main course"),
    SIDE_DISH("Side dish"),
    SOUP("Soup"),
    SALAD("Salad"),
    BREAD("Bread"),
    CEREALS("Cereals"),
    DESSERT("Dessert"),
    DRINKS("Drinks"),
    SANDWICHES("Sandwiches"),
    BISCUITS_AND_COOKIES("Biscuits and cookies"),
    CONDIMENTS_AND_SAUCES("Condiments and sauces");

    private final String displayName;

    DishType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static DishType fromDisplayName(String displayName) {
        for (DishType type : DishType.values()) {
            if (type.displayName.equalsIgnoreCase(displayName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid dish type: " + displayName);
    }
}
