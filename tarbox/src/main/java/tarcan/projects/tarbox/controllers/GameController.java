package tarcan.projects.tarbox.controllers;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import tarcan.projects.tarbox.enums.GameState;
import tarcan.projects.tarbox.enums.GameType;
import tarcan.projects.tarbox.models.Game;
import tarcan.projects.tarbox.repositories.GameRepository;
import tarcan.projects.tarbox.utilities.MaxPlayersReachedException;

@RestController
@RequestMapping("/api")
@RateLimiter(name = "tarbox-api")
public class GameController {

    Logger logger = LoggerFactory.getLogger(GameController.class);

    @Autowired
    GameRepository gameRepository;

    @GetMapping("/games/{gameId}") 
    public ResponseEntity<Game> getGame(@PathVariable Long gameId) {
        try {
            if(gameId == null) {
                return ResponseEntity.notFound().build();
            }

            Optional<Game> game = gameRepository.findByID(gameId);
            if(game.isPresent()) {
                return new ResponseEntity<Game>(game.get(), HttpStatus.OK);
            }
            else {
                return ResponseEntity.notFound().build();
            } 
        }
        catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/games/{gameId}/players")
    public ResponseEntity<Object> getPlayers(@PathVariable Long gameId) {
        Optional<Game> gameWithId = gameRepository.findByID(gameId);

        if(gameWithId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", "Game cannot be found"));
        }

        Game currentGame = gameWithId.get();

        return ResponseEntity.ok().body(currentGame.getOtherPlayers());
    } 

    @PostMapping("/games/players")
    public ResponseEntity<Object> addPlayerToGame(@RequestBody Map<String, String> request) {
        String player = request.get("player");
        Long id; 
        try {
            id = Long.parseLong(request.get("id"));
        }
        catch(NumberFormatException ex) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message","id format should be an long int"));
        }

        if(player == null || id == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message","The body should include player and id."));
        }

        Optional<Game> gameWithId = gameRepository.findByID(id);
        if(gameWithId.isPresent()) {
            try {
                Game game = gameWithId.get();
                if(game.addPlayer(player)) {
                    logger.info(String.format("Player %s has been added to game %d", player, id));
                    return ResponseEntity.ok().body(gameRepository.save(game));
                }
                else return ResponseEntity.internalServerError().body(null);
            }
            catch (MaxPlayersReachedException e) {
                return ResponseEntity.badRequest().header("message", e.getMessage()).body(null);
            }
            
            
        }
        else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", "The game with the id is not found."));
        }
    }

    /**
     * Creates a game.
     * @param body Body of the request.
     * {
     *  type: game_type
     * }
     * @param request
     * @return A JSON Object with id property if succesful, error if not.
     */
    @PostMapping("/games")
    public ResponseEntity<String> createGame(@RequestBody String body, HttpServletRequest request) {
        JSONObject returnBody = new JSONObject();
        if(body == null || body.isEmpty()) {
            return badRequest("The request body is null.");
        }

        try {
            String type = new JSONObject(body).getString("type");
            if(!GameType.isPossibleGameType(type)) {
                return badRequest("The game type " + type + " is not found.");
            }
            Game toBeCreatedGame = new Game(GameType.valueOf(type));
            toBeCreatedGame.setState(GameState.NOT_STARTED);
            Game createdGame = gameRepository.save(toBeCreatedGame);
            logger.info(String.format("Game with id %d has been created.", createdGame.getID()));
            returnBody.put("id", createdGame.getID());
            return ResponseEntity.status(HttpStatus.CREATED).body(returnBody.toString());
        }
        catch(MaxPlayersReachedException e) {
            return badRequest(e.getMessage());
        }
        catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    @PutMapping("/games/{gameId}")
    public ResponseEntity<String> updateGame(@PathVariable Long gameId, @RequestBody String body, HttpServletRequest request) {
        JSONObject result = new JSONObject();
        if(gameId == null) {
            result.put("error", "No game was sent.");
            return ResponseEntity.badRequest().body(result.toString());
        }

        Optional<Game> gameOption = gameRepository.findByID(gameId);

        if(gameOption.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String operation = new JSONObject(body).getString("operation");

        switch (operation.toUpperCase()) {
            case "END": 
                Game game = gameOption.get();
                game.setState(GameState.ENDED);
                gameRepository.save(game);
                return ResponseEntity.status(200).build();        
            default:
                result.put("error", "Operation " + operation + "is not supported.");
                return ResponseEntity.badRequest().body(result.toString()); 
        }
    }

    @GetMapping("/games/{gameId}/state")
    public ResponseEntity<String> getGameState(@PathVariable Long gameId) {
        Optional<Game> gameOption = gameRepository.findByID(gameId);

        if(gameOption.isEmpty()) {
            return badRequest("The game does not exist.");
        }

        JSONObject res = new JSONObject();

        GameState currentEvent = gameOption.get().getState();
        if(currentEvent == null) {
            gameOption.get().setState(GameState.NOT_STARTED);
            gameRepository.save(gameOption.get());
            res.put("status", GameState.NOT_STARTED);
            return new ResponseEntity<>(res.toString(), HttpStatus.OK);
        }

        res.put("status", currentEvent);

        return new ResponseEntity<>(res.toString(), HttpStatus.OK);
    }

    private ResponseEntity<String> badRequest(String message) {
        JSONObject badRequesObject = new JSONObject();
        badRequesObject.put("error", message);
        return ResponseEntity.badRequest().body(badRequesObject.toString());
    }
}
