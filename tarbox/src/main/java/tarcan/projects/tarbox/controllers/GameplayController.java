package tarcan.projects.tarbox.controllers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import tarcan.projects.tarbox.components.SecretCodeGenerator;
import tarcan.projects.tarbox.enums.GameState;
import tarcan.projects.tarbox.enums.GameType;
import tarcan.projects.tarbox.messages.GameEventMessage;
import tarcan.projects.tarbox.models.Game;
import tarcan.projects.tarbox.repositories.GameRepository;
import tarcan.projects.tarbox.utilities.MessageDestination;

@Controller
public class GameplayController {

    @Autowired
    private GameRepository gameRepository;

    private Logger logger = LoggerFactory.getLogger(GameplayController.class);

    @Autowired
    private SimpMessagingTemplate messageSender;

    @Autowired
    private SecretCodeGenerator codeGenerator;

    @MessageMapping("/game/{gameId}/events/run")
    public void gameStarted(GameEventMessage message, @DestinationVariable Long gameId) throws InterruptedException {
        Optional<Game> g = gameRepository.findByID(gameId);

        if(g.isEmpty()) {
            throw new RuntimeException(String.format("Game with id %d does not exist.", gameId));
        }

        Game existingGame = g.get();

        if(existingGame.currentlyRunning()) {
            return;
        }

        logger.info(String.format("Starting the game with id %d", gameId));
        if(existingGame.getOtherPlayers().size() < 3) {
            GameEventMessage res = new GameEventMessage();
            res.setGameId(String.valueOf(gameId));
            res.setMessage("There has to be at least 3 players.");
            messageSender.convertAndSend(MessageDestination.toPlayers(gameId), res);
            return;
        }

        existingGame.setState(GameState.STARTED);
        String gameSecretCode = existingGame.getSecretCode();
        gameRepository.save(existingGame);

        // Now broadcast to the players that the game have started.
        GameEventMessage res = new GameEventMessage();
        res.setGameType(GameType.WORD_FINDER);
        res.setGameId(String.valueOf(gameId));
        res.setStatus(GameState.STARTED);
        res.setSecretCode(gameSecretCode);
        res.setMessage("Game has started.");

        messageSender.convertAndSend(MessageDestination.toPlayers(gameId), res, null, null);
        messageSender.convertAndSend(MessageDestination.toGameServer(gameId), res, null, null);
    }
}
