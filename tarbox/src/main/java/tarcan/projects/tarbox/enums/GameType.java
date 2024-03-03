package tarcan.projects.tarbox.enums;

import java.util.Set;

public enum GameType {
    WORD_FINDER,
    MOVER;

    private static Set<String> possibleValues;
    static {
        possibleValues = Set.of("WORD_FINDER", "MOVER");
    }

    public static boolean isPossibleGameType(String gameType) {
        return possibleValues.contains(gameType);
    }
}
