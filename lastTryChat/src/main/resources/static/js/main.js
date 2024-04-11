'use strict'

var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

document.getElementById('emojiButton').addEventListener('click', function(event) {
  var emojiPicker = document.getElementById('emojiPicker');
  emojiPicker.classList.toggle('hidden');
  event.stopPropagation();
});

document.getElementById('emojiPicker').addEventListener('click', function(event) {
  if (event.target.tagName === 'SPAN') {
    var emoji = event.target.textContent;
    var messageInput = document.getElementById('message');
    messageInput.value += emoji;
    messageInput.focus();
  }
});
function addEmojiToInput(event) {
  const emoji = event.target.textContent;
  const messageInput = document.getElementById('message');
  messageInput.value += emoji;
  messageInput.focus();
}

document.addEventListener('click', function(event) {
  var emojiPicker = document.getElementById('emojiPicker');
  if (!emojiPicker.contains(event.target)) {
    emojiPicker.classList.add('hidden');
  }
});

document.querySelectorAll('.emoji-category').forEach(function (categoryButton) {
  categoryButton.addEventListener('click', function () {
    var category = this.getAttribute('data-category');
    updateEmojiContainer(category);
  });
});

function clearEmojiContainer() {
  const emojiContainer = document.querySelector('.emoji-container');
  let first = emojiContainer.firstElementChild;
  while (first) {
    first.removeEventListener('click', addEmojiToInput);
    first.remove();
    first = emojiContainer.firstElementChild;
  }
}

function updateEmojiContainer(category) {
 clearEmojiContainer();
  var emojiContainer = document.querySelector('.emoji-container');
  // Clear the current emojis and their event listeners
  while (emojiContainer.firstChild) {
    emojiContainer.removeChild(emojiContainer.firstChild);
  }

  var emojis = {
    'smileys': ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '🫨', '😶‍🌫️', '🤌🏻'],
    'animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
    'food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈'],
  };

  emojis[category].forEach(function (emoji) {
    var span = document.createElement('span');
    span.textContent = emoji;
    span.addEventListener('click', function () {
      document.getElementById('message').value += this.textContent;
      document.getElementById('emojiPicker').classList.add('hidden');
    });
    emojiContainer.appendChild(span);
  });
}

updateEmojiContainer('smileys');

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

function onConnected() {

    stompClient.subscribe('/topic/public', onMessageReceived);

    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )
    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    event.preventDefault();
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);

         if(message.imageBase64) {
                    var imageElement = document.createElement('img');
                    imageElement.src = message.imageBase64;
                    imageElement.style.maxWidth = '200px';
                    messageElement.appendChild(imageElement);
                }
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)

function createFloatingElement() {
    const floatContainer = document.createElement('div');
    floatContainer.className = 'floating-element-container';
    document.body.appendChild(floatContainer);

    for (let i = 0; i < 10; i++) {
        const floatingElement = document.createElement('div');
        floatingElement.className = 'floating-element';
        floatContainer.appendChild(floatingElement);

        floatingElement.style.left = `${Math.random() * 100}vw`;
        floatingElement.style.animationDuration = `${Math.random() * 6 + 6}s`;
    }
}
createFloatingElement();


const dayBackground = 'url("day-background.jpg")';
const nightBackground = 'url("night.jpg")';

document.getElementById('toggleBackground').addEventListener('click', function() {
    document.body.classList.add('background-transition');
  if (document.body.classList.contains('day-background')) {
    document.body.classList.remove('day-background');
    document.body.classList.add('night-background');
    this.textContent = '🌕';
  } else {
    document.body.classList.remove('night-background');
    document.body.classList.add('day-background');
    this.textContent = '🌞';
  }

   setTimeout(() => {
          document.body.classList.remove('background-transition');
      }, 1000);
});



