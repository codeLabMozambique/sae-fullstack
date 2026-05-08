package codelab.api.smart.sae.forum.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class DisciplinaEnumConverter implements AttributeConverter<DisciplinaEnum, String> {

    @Override
    public String convertToDatabaseColumn(DisciplinaEnum attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public DisciplinaEnum convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return DisciplinaEnum.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return DisciplinaEnum.GERAL;
        }
    }
}
