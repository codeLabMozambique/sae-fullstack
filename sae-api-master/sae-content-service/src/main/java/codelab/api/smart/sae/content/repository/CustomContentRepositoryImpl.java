package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.Content;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class CustomContentRepositoryImpl implements CustomContentRepository {

    private final MongoTemplate mongoTemplate;

    public CustomContentRepositoryImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Page<Content> findWithFilters(String discipline, String level, Long classroomId, String uploadedBy, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (discipline != null && !discipline.isEmpty()) {
            criteriaList.add(Criteria.where("discipline").is(discipline));
        }
        if (level != null && !level.isEmpty()) {
            criteriaList.add(Criteria.where("level").is(level));
        }
        if (uploadedBy != null && !uploadedBy.isEmpty()) {
            criteriaList.add(Criteria.where("uploadedBy").is(uploadedBy));
        }

        if (classroomId != null) {
            // Logica: Pertence a esta turma OU e publico (target_classroom_ids e nulo ou vazio)
            criteriaList.add(new Criteria().orOperator(
                Criteria.where("targetClassroomIds").is(classroomId),
                Criteria.where("targetClassroomIds").exists(false),
                Criteria.where("targetClassroomIds").size(0)
            ));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Content.class);
        query.with(pageable);
        List<Content> contents = mongoTemplate.find(query, Content.class);

        return new PageImpl<>(contents, pageable, total);
    }
}
