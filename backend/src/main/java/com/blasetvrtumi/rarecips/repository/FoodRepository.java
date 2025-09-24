package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

    Food findByName(String name);

    Food findById(long id);

}
