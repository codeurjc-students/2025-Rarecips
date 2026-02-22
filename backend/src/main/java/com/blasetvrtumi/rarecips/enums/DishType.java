package com.blasetvrtumi.rarecips.enums;

public enum DishType {
    ALCOHOL_COCKTAIL("alcohol cocktail"),
    BISCUITS_AND_COOKIES("biscuits and cookies"),
    BREAD("bread"),
    CEREALS("cereals"),
    CHRISTMAS("christmas"),
    CONDIMENTS_AND_SAUCES("condiments and sauces"),
    DESSERTS("desserts"),
    DRINKS("drinks"),
    EGG("egg"),
    MAIN_COURSE("main course"),
    PANCAKE("pancake"),
    SALAD("salad"),
    SANDWICHES("sandwiches"),
    SOUP("soup"),
    SPECIAL_OCCASIONS("special occasions"),
    STARTER("starter");

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
