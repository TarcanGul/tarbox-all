package tarcan.projects.tarbox.controllers;

import static org.mockito.Mockito.times;

import java.util.ArrayList;
import java.util.Optional;

import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import jakarta.servlet.http.HttpServletRequest;
import tarcan.projects.tarbox.enums.GameState;
import tarcan.projects.tarbox.enums.GameType;
import tarcan.projects.tarbox.models.Game;
import tarcan.projects.tarbox.repositories.GameRepository;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;

@WebMvcTest(GameController.class)
public class GameControllerTest {

    @MockBean
    GameRepository mockGameRepository;

    @InjectMocks
    GameController testedGameController;

    @Mock
    HttpServletRequest mockRequest;

    @Mock
    Game mockGame;


    @Autowired
    private MockMvc mockMvc;

    private static final Long TEST_ID = 1112L;

    @Test
    public void testGetExistingGame() throws Exception {

        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGame.getState()).thenReturn(GameState.NOT_STARTED);
        Mockito.when(mockGame.getType()).thenReturn(GameType.WORD_FINDER);
        Mockito.when(mockGame.getOtherPlayers()).thenReturn(new ArrayList<>());
        Mockito.when(mockGameRepository.findByID(TEST_ID)).thenReturn(Optional.of(mockGame));

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("id", TEST_ID);
        expectedResponse.put("otherPlayers", JSONObject.wrap(new ArrayList<>()));
        expectedResponse.put("state", "NOT_STARTED");
        expectedResponse.put("type", "WORD_FINDER");

        mockMvc.perform(MockMvcRequestBuilders.get("/api/games/" + TEST_ID)
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.content().json(expectedResponse.toString()));
    }

    @Test 
    public void testGetNonExistingGame() throws Exception {
        Mockito.when(mockGameRepository.findByID(TEST_ID)).thenReturn(Optional.empty());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/games/" + TEST_ID)
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    public void updateGameEndTheGame() throws Exception {
        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGame.getState()).thenReturn(GameState.NOT_STARTED);
        Mockito.when(mockGame.getType()).thenReturn(GameType.WORD_FINDER);
        Mockito.when(mockGame.getOtherPlayers()).thenReturn(new ArrayList<>());
        Mockito.when(mockGameRepository.findByID(TEST_ID)).thenReturn(Optional.of(mockGame));
        Mockito.when(mockGameRepository.save(mockGame)).thenReturn(mockGame);

        JSONObject requestBody = new JSONObject();
        requestBody.put("operation", "END");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/games/" + TEST_ID)
        .content(requestBody.toString())
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isOk());

        Mockito.verify(mockGame, times(1)).setState(GameState.ENDED);
    }

    @Test
    public void updateNonExistingGame() throws Exception {
        Mockito.when(mockGameRepository.findByID(TEST_ID)).thenReturn(Optional.empty());

        JSONObject requestBody = new JSONObject();
        requestBody.put("operation", "END");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/games/" + TEST_ID)
        .content(requestBody.toString())
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isNotFound()); 
    }

    @Test
    public void testWordfinderCreateGameHappyPath() throws Exception {

        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGameRepository.save(Mockito.notNull())).thenReturn(mockGame);

        JSONObject testBody = new JSONObject();
        testBody.put("type", "WORD_FINDER");

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("id", TEST_ID);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/games")
            .content(testBody.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.content().json(expectedResponse.toString()));
    }

    @Test
    public void testCreateGameUnknownType() throws Exception {

        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGameRepository.save(Mockito.notNull())).thenReturn(mockGame);

        JSONObject testBody = new JSONObject();
        testBody.put("type", "UNKNOWN_TYPE");

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("id", TEST_ID);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/games")
            .content(testBody.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void testCreateGameEmptyBody() throws Exception {

        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGameRepository.save(Mockito.notNull())).thenReturn(mockGame);

        JSONObject testBody = new JSONObject();

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("id", TEST_ID);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/games")
            .content(testBody.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void testCreateGameNonEmptyBodyNoType() throws Exception {

        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGameRepository.save(Mockito.notNull())).thenReturn(mockGame);

        JSONObject testBody = new JSONObject();
        testBody.put("some_other_property", "value");

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("id", TEST_ID);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/games")
            .content(testBody.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void testGameGetState() throws Exception {
        Mockito.when(mockGame.getID()).thenReturn(TEST_ID);
        Mockito.when(mockGame.getState()).thenReturn(GameState.STARTED);
        Mockito.when(mockGame.getType()).thenReturn(GameType.WORD_FINDER);
        Mockito.when(mockGame.getOtherPlayers()).thenReturn(new ArrayList<>());
        Mockito.when(mockGameRepository.findByID(TEST_ID)).thenReturn(Optional.of(mockGame));

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("status", "STARTED");

        mockMvc.perform(MockMvcRequestBuilders.get("/api/games/" + TEST_ID + "/state")
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.content().json(expectedResponse.toString()));
    }

    @Test
    public void testNonexistantGameGetState() throws Exception {
        Mockito.when(mockGameRepository.findByID(TEST_ID)).thenReturn(Optional.empty());

        JSONObject expectedResponse = new JSONObject();
        expectedResponse.put("status", "STARTED");

        mockMvc.perform(MockMvcRequestBuilders.get("/api/games/" + TEST_ID + "/state")
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }
}
