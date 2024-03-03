package tarcan.projects.tarbox.converters;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ListPlayerConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> players) {

        if(players == null || players.isEmpty()) {
            return "";
        }

        StringBuilder result = new StringBuilder();

        for(String player : players) {
            result.append(player).append(',');
        }

        return result.toString();
    }

    /**
     * We are specifying we want an array list (mutable) implementation.
     */
    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if(dbData == null || dbData.isEmpty()) {
            return new ArrayList<>(); // Returning empty but mutable list.
        }
        
        List<String> result = new ArrayList<String>(Arrays.asList(dbData.split(",")));
        return result;
    }
    
}
