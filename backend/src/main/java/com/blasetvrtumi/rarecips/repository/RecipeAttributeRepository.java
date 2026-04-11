package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.RecipeAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeAttributeRepository extends JpaRepository<RecipeAttribute, Long> {
    List<RecipeAttribute> findByType(String type);
}
