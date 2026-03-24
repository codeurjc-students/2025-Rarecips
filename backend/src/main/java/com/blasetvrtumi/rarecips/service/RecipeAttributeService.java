package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.RecipeAttribute;
import com.blasetvrtumi.rarecips.repository.RecipeAttributeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RecipeAttributeService {

    @Autowired
    private RecipeAttributeRepository repository;

    public List<RecipeAttribute> getAll() {
        return repository.findAll();
    }

    public List<RecipeAttribute> getByType(String type) {
        return repository.findByType(type);
    }

    public RecipeAttribute save(RecipeAttribute attribute) {
        return repository.save(attribute);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Optional<RecipeAttribute> getById(Long id) {
        return repository.findById(id);
    }
}
