window.addEventListener('load', (e) => runGame(e));

const game = document.querySelector("main");
const pageFrame = document.createElement('div');
pageFrame.classList.add('game-page');

game.appendChild(pageFrame);

const toGameServer = (gameId) => `/game/${gameId}/events/server`;

const BASE_URL = 'http://localhost:8080';

const mq = {
  queue: [],
  isProcessing: false
};

function runGame(e) {
    const client = new StompJs.Client({
        brokerURL: 'ws://localhost:8080/ws',
        debug: function (str) {
          console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      
      client.onConnect = async function (frame) {
        // Do something, all subscribes must be done is this callback
        // This is needed because this will be executed after a (re)connect
        
        const gameId = document.cookie
          .split("; ")
          .find((val) => val.startsWith("tarbox_gameid="))
          ?.split('=')[1];

        const playerName = document.cookie
        .split("; ")
        .find((val) => val.startsWith("tarbox_username="))
        ?.split('=')[1];

        if(gameId === undefined) {
          return new Error("Game id cannot be retrieved.");
        }

        // Check if already notified.
        
        notifyPlayerEntry(client, gameId, playerName);

        const gameStateResponse = await fetch(`/api/games/${gameId}/state`);
        const gameStateJSON = await gameStateResponse.json();
        const currentStatus = gameStateJSON.status;

        await updateUI({
          status: currentStatus,
          game: gameId,
          currentPlayer: playerName
        });

        const subscription = client.subscribe(`/game/${gameId}/actions`, async (message) => {
            if (message.body) {
                mq.queue.push(message);
                if(!mq.isProcessing) {
                  await processMessage(gameId, client, playerName);
                }
            } else {
                console.log('got empty message');
            }
        });
      };
      
      client.onStompError = function (frame) {
        // Will be invoked in case of error encountered at Broker
        // Bad login/passcode typically will cause an error
        // Complaint brokers will set `message` header with a brief message. Body may contain details.
        // Compliant brokers will terminate the connection after any error
        console.log('Broker reported error: ' + frame.headers['message']);
        console.log('Additional details: ' + frame.body);
      };

      client.onDisconnect = async function(frame) {
        await updateUI({status: "DISCONNECTED"});
      }
      
      client.activate();
}

/**
 * Updates the UI based on the state of the game.
 * 
 * @param {*} stateObject 
 * {
 * state: current game state (sent message)
 * game: gameid,
 * client: ws client,
 * currentPlayer: string
 * }
 */
async function updateUI(current) {
  clearGame();
  switch(current.status) {
    case 'STARTED': 
      const startedView = document.createElement('started-view');
      startedView.gameId = current.game;
      pageFrame.appendChild(startedView);
      break;
    case 'PICKED':
      if(!current.message) {
        throw new Error('no message is sent to the ui function');
      }
      if(current.message.player === current.currentPlayer) {
        const pickedView = document.createElement('picked-view');
        pickedView.formCallback = function (e) {
          e.preventDefault();

          let formData = new FormData(this);

          let word = formData.get('word');
          let prompt = formData.get('prompt');

          if(word.trim() === '') {
            notify('Word cannot be empty!');
            return false;
          }

          if(prompt.trim() === '') {
            notify('Prompt cannot be empty!');
            return false;
          }

          const sendDataBody = {
            status: 'DONE',
            word: word,
            prompt: prompt,
            gameId: current.game,
            player: current.currentPlayer,
            time: Date.now()
          }

          current.client.publish({
            destination: toGameServer(current.game),
            body:  JSON.stringify(sendDataBody)
          });
        };
        pageFrame.appendChild(pickedView);
      }
      else {
        const waitingView = document.createElement('waiting-view');
        waitingView.message = `Waiting for ${current.message.player} to pick a word...`;
        pageFrame.appendChild(waitingView);
      }
      break;
    case 'QUESTION':
      if(current.message.player !== current.currentPlayer) {
        const questionView = document.createElement('question-view');
        questionView.prompt = current.message.prompt;
        questionView.formCallback = async function (e) {
          e.preventDefault();

          const formData = new FormData(this);

          let answer = formData.get('answer');

          if(answer.trim() === '') {
            notify('Answer cannot be empty!')
            return false;
          }

          const answerBody = {
            status: 'ANSWER',
            word: answer,
            gameId: current.game,
            player: current.currentPlayer,
            time: Date.now()
          }
          
          current.client.publish({
            destination: toGameServer(current.game),
            body:  JSON.stringify(answerBody)
          });

          clearGame();
          
          const waitingView = document.createElement('waiting-view');
          waitingView.message = `Answer sent! Waiting other players to answer...`;
          pageFrame.appendChild(waitingView);

        }

        pageFrame.appendChild(questionView);
      }
      else {
        const waitingView = document.createElement('waiting-view');
        waitingView.message = `Waiting other players to answer...`;
        pageFrame.appendChild(waitingView);
      }
      break;
    case 'ENDED':
      // ended view
      console.log(current.client);
      await current.client.deactivate();
      const endedView = document.createElement('ended-view');
      endedView.message = 'Thank you for playing!';
      endedView.redirectMessage = 'Redirecting in 5 seconds...';
      pageFrame.appendChild(endedView);
      setTimeout(() => {
        window.location.replace("/");
      }, 5000);
      break;
    case 'DISCONNECTED':
      const disconnectedView = document.createElement('waiting-view');
      disconnectedView.message = "You have been disconnected.";
      pageFrame.appendChild(disconnectedView);
      break;
    default:
      const waitingView = document.createElement('waiting-view');
      waitingView.message = `Waiting for the game ${current.game} to start...`;
      pageFrame.appendChild(waitingView);
      break;
  }
}

async function processMessage(gameId, wsClient, player) {
  if(mq.queue.length <= 0) return;
  mq.isProcessing = true;
  while(mq.queue.length > 0) {
    const message = mq.queue.shift();
    let messageBody = JSON.parse(message.body);
    await updateUI({
      message: messageBody,
      status: messageBody.status,
      game: gameId,
      client: wsClient,
      currentPlayer: player
    })
  }
  mq.isProcessing = false;
}

function notifyPlayerEntry(client, gameId, playerName) {

  const playerEntryBody = {
    status: 'P_ADDED',
    gameId: gameId,
    player: playerName
  }

  client.publish({
    destination: toGameServer(gameId),
    body:  JSON.stringify(playerEntryBody)
  });

  console.log(`Notified with: ${JSON.stringify(playerEntryBody)}`);
}

function clearGame() {
  while(pageFrame.firstChild) {
    pageFrame.removeChild(pageFrame.firstChild);
  }
}
let statusTextIsUp = false;

function notify(text) {
    if(statusTextIsUp) {
        return;
    }
    let statusArea = document.querySelector(".status-text");
    const statusText = document.createElement('h3');
    fadeIn(statusArea);
    statusText.innerText = text;
    statusTextIsUp = true;
    statusArea.appendChild(statusText);
    setTimeout(() => {
        fadeOut(statusArea);
    }, 3000);
}

function fadeIn(element) {
    element.classList.remove('fade-out-animate');
    element.classList.add('fade-in-animate');
}

function fadeOut(element) {
    element.classList.remove('fade-in-animate');
    element.classList.add('fade-out-animate');
}

document.querySelector(".status-text").addEventListener('animationend', (e) => {
    if(e.animationName === 'fadeOut') {
        while(e.target.firstChild) {
            e.target.removeChild(e.target.firstChild);
        }
        statusTextIsUp = false;
    }
});