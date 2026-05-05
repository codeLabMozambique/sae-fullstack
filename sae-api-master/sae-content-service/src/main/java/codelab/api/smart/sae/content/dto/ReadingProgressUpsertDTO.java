package codelab.api.smart.sae.content.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class ReadingProgressUpsertDTO {

    @NotNull(message = "currentPage é obrigatório")
    @Min(value = 0, message = "currentPage deve ser >= 0")
    private Integer currentPage;

    @PositiveOrZero(message = "readingTimeSecondsDelta deve ser >= 0")
    private Long readingTimeSecondsDelta;

    public Integer getCurrentPage() { return currentPage; }
    public void setCurrentPage(Integer currentPage) { this.currentPage = currentPage; }

    public Long getReadingTimeSecondsDelta() { return readingTimeSecondsDelta; }
    public void setReadingTimeSecondsDelta(Long readingTimeSecondsDelta) { this.readingTimeSecondsDelta = readingTimeSecondsDelta; }
}
