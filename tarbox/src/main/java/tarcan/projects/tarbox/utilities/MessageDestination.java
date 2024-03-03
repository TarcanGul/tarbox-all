package tarcan.projects.tarbox.utilities;

public class MessageDestination {
    public static String toPlayers(Long gameId) {
        return "/game/" + String.valueOf(gameId) + "/actions";
    }

    public static String toGameServer(Long gameId) {
        return "/game/" + String.valueOf(gameId) + "/events/server";
    }
}
