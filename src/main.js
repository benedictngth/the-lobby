import { loadState, saveState } from './storage.js';

const app = document.querySelector('#app');

const loaded = loadState();
let state = loaded.state;

const heading = document.createElement('h1');
heading.textContent = 'The Lobby';

const intro = document.createElement('p');
intro.textContent = 'Quick Pairing demo: start a meetup in your area, or explore at your own pace.';

const actions = document.createElement('div');
actions.className = 'demo-start-actions';

const guidedButton = document.createElement('button');
guidedButton.type = 'button';
guidedButton.textContent = 'Guided walkthrough';

const freeButton = document.createElement('button');
freeButton.type = 'button';
freeButton.textContent = 'Explore freely';

actions.append(guidedButton, freeButton);

const persistenceStatus = document.createElement('p');
persistenceStatus.className = 'persistence-warning';
persistenceStatus.setAttribute('role', 'status');
persistenceStatus.textContent = loaded.warning;
persistenceStatus.hidden = !loaded.warning;

app.replaceChildren(heading, intro, actions, persistenceStatus);

// Every state mutation goes through persist so the session survives a refresh.
function persist(nextState) {
  state = nextState;
  const { warning } = saveState(state);
  persistenceStatus.textContent = warning;
  persistenceStatus.hidden = !warning;
  return state;
}
