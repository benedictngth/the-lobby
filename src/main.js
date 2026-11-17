const app = document.querySelector('#app');

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
app.replaceChildren(heading, intro, actions);
