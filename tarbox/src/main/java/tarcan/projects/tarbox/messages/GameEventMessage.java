package tarcan.projects.tarbox.messages;

import java.util.Calendar;

import io.micrometer.common.lang.NonNull;
import lombok.Data;
import tarcan.projects.tarbox.enums.GameState;
import tarcan.projects.tarbox.enums.GameType;

@Data
public class GameEventMessage {
    
    @NonNull 
    private GameType gameType;

    @NonNull
    private String gameId;

    private String secretCode;

    private String message;

    private GameState status;

    private Calendar time;

    private String player;

    private String word;

    private String prompt;
}
