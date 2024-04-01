package tarcan.projects.tarbox.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import tarcan.projects.tarbox.TarboxConfiguration;
import tarcan.projects.tarbox.converters.ListPlayerConverter;
import tarcan.projects.tarbox.enums.GameState;
import tarcan.projects.tarbox.enums.GameType;
import tarcan.projects.tarbox.utilities.MaxPlayersReachedException;
import tarcan.projects.tarbox.utilities.PlayerNameAlreadyExistsException;

@Entity
@Table(name = "games") 
public class Game {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Getter
    private Long ID;

    @Column(name = "type")
    @Getter
    private GameType type;

    @Column(name = "other_players", nullable = true)
    @Convert(converter = ListPlayerConverter.class)
    @Getter
    private List<String> otherPlayers;

    @Column(name = "state")
    @Getter
    @Setter
    private GameState state;

    @Column(name = "secret_code")
    @Getter
    @Setter
    private String secretCode;

    public Game(GameType type) {
        this.type = type;
        this.otherPlayers = new ArrayList<>(TarboxConfiguration.NUMBER_OF_JOINING_PLAYERS);
    }

    protected Game () {}

    public void copyPlayers(List<String> otherPlayers) throws MaxPlayersReachedException {

        if(otherPlayers == null || otherPlayers.isEmpty()) 
            return;
        if(otherPlayers.size() > TarboxConfiguration.NUMBER_OF_JOINING_PLAYERS) {
            throw new MaxPlayersReachedException();
        }

        this.otherPlayers.addAll(otherPlayers);
    }

    public boolean currentlyRunning() {
        return state == GameState.STARTED;
    }

    public boolean addPlayer(String player) throws MaxPlayersReachedException, PlayerNameAlreadyExistsException {

        if(otherPlayers.size() >= TarboxConfiguration.NUMBER_OF_JOINING_PLAYERS) {
            throw new MaxPlayersReachedException();
        }

        if(otherPlayers.contains(player)) {
            throw new PlayerNameAlreadyExistsException();
        }

        return otherPlayers.add(player);
    }

    private String getOtherPlayersString() {
        if(otherPlayers == null || otherPlayers.isEmpty())
            return "none";
        return otherPlayers.toString();
    }    

    @Override
    public String toString() {
        return "Game Type: " + type
            + " -- " 
            + "Other Players: " + getOtherPlayersString()
            ;
    }
}
