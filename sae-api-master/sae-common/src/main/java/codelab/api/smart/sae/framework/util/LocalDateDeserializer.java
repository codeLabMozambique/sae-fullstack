/**
 *
 */
package codelab.api.smart.sae.framework.util;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public class LocalDateDeserializer extends JsonDeserializer<LocalDate>  {
    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) 
            throws IOException, JsonProcessingException {
        String dateString = p.getText();
        // Converta a string para ZonedDateTime e depois extraia LocalDate
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(dateString, DateTimeFormatter.ISO_DATE_TIME);
        return zonedDateTime.toLocalDate();
    }
}
