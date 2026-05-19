package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.dto.AccessModeStatsDTO;
import codelab.api.smart.sae.content.dto.ContentStatsDTO;
import codelab.api.smart.sae.content.model.ReadingHistory;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.LimitOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.SortOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContentStatsService {

    @Autowired
    private MongoTemplate mongoTemplate;

    public List<ContentStatsDTO> getMostAccessed(String period, int limit) {
        LocalDateTime since;
        switch (period) {
            case "week":  since = LocalDateTime.now().minusWeeks(1);  break;
            case "month": since = LocalDateTime.now().minusMonths(1); break;
            default:      since = LocalDateTime.of(2000, 1, 1, 0, 0); break;
        }

        MatchOperation match = Aggregation.match(Criteria.where("readAt").gte(since));

        GroupOperation group = Aggregation.group("contentId")
                .first("contentTitle").as("contentTitle")
                .first("discipline").as("discipline")
                .count().as("accessCount")
                .addToSet("userId").as("userIds")
                .sum("durationSeconds").as("totalReadingTimeSeconds");

        // $addFields: derive contentId from _id, compute uniqueUsers = $size(userIds)
        var addFields = (org.springframework.data.mongodb.core.aggregation.AggregationOperation)
                ctx -> new Document("$addFields",
                        new Document("contentId", "$_id")
                                .append("uniqueUsers", new Document("$size", "$userIds")));

        SortOperation sort = Aggregation.sort(Sort.by(Sort.Direction.DESC, "accessCount"));
        LimitOperation limitOp = Aggregation.limit(limit);

        Aggregation aggregation = Aggregation.newAggregation(match, group, addFields, sort, limitOp);

        return mongoTemplate.aggregate(aggregation, ReadingHistory.class, ContentStatsDTO.class)
                .getMappedResults();
    }

    public AccessModeStatsDTO getAccessModeStats(String period) {
        LocalDateTime since;
        switch (period) {
            case "week":  since = LocalDateTime.now().minusWeeks(1);  break;
            case "month": since = LocalDateTime.now().minusMonths(1); break;
            default:      since = LocalDateTime.of(2000, 1, 1, 0, 0); break;
        }

        MatchOperation match = Aggregation.match(Criteria.where("readAt").gte(since));

        GroupOperation group = Aggregation.group("accessMode").count().as("count");

        var results = mongoTemplate.aggregate(
                Aggregation.newAggregation(match, group),
                ReadingHistory.class,
                org.bson.Document.class
        ).getMappedResults();

        long online = 0, offline = 0;
        for (org.bson.Document doc : results) {
            String mode = doc.getString("_id");
            long cnt = ((Number) doc.get("count")).longValue();
            if ("OFFLINE".equalsIgnoreCase(mode)) offline = cnt;
            else online = cnt;
        }

        AccessModeStatsDTO dto = new AccessModeStatsDTO();
        dto.setOnlineCount(online);
        dto.setOfflineCount(offline);
        dto.setTotalCount(online + offline);
        dto.setOfflinePercentage((online + offline) == 0 ? 0.0
                : (offline * 100.0) / (online + offline));
        return dto;
    }
}
