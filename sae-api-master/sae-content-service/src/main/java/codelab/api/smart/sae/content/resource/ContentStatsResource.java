package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.dto.AccessModeStatsDTO;
import codelab.api.smart.sae.content.dto.ContentStatsDTO;
import codelab.api.smart.sae.content.service.ContentStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class ContentStatsResource {

    @Autowired
    private ContentStatsService contentStatsService;

    /** GET /api/analytics/most-accessed?period=month&limit=10 */
    @GetMapping("/most-accessed")
    public ResponseEntity<List<ContentStatsDTO>> getMostAccessed(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(contentStatsService.getMostAccessed(period, Math.min(limit, 50)));
    }

    /** GET /api/analytics/access-mode?period=month — online vs offline */
    @GetMapping("/access-mode")
    public ResponseEntity<AccessModeStatsDTO> getAccessMode(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(contentStatsService.getAccessModeStats(period));
    }
}
