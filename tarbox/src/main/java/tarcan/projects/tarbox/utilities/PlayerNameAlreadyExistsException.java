package tarcan.projects.tarbox.utilities;

public class PlayerNameAlreadyExistsException extends RuntimeException {
    private static final String MESSAGE = "This player name is already joined to the game, try something else.";

    public PlayerNameAlreadyExistsException() {
        super(MESSAGE);
    }
}
