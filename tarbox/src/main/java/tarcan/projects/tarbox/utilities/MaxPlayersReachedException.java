package tarcan.projects.tarbox.utilities;

public class MaxPlayersReachedException extends RuntimeException {

    private static final String MESSAGE = "The maximum number of players have joined.";

    public MaxPlayersReachedException() {
        super(MESSAGE);
    }
}
