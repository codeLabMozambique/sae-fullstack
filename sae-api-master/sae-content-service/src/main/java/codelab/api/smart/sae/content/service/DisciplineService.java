package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.jpa.Discipline;
import codelab.api.smart.sae.content.repository.jpa.DisciplineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisciplineService {

    @Autowired
    private DisciplineRepository disciplineRepository;

    public List<Discipline> listAll() {
        return disciplineRepository.findAll();
    }

    public Discipline create(String name) {
        if (disciplineRepository.findByName(name).isPresent()) {
            return disciplineRepository.findByName(name).get();
        }
        Discipline discipline = new Discipline();
        discipline.setName(name);
        return disciplineRepository.save(discipline);
    }

    public void delete(Long id) {
        disciplineRepository.deleteById(id);
    }
}
