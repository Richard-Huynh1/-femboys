const messagesEl = document.getElementById('messages');
const form = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

let convo = []; // {role:'user'|'model', text:string}

function render() {
  messagesEl.innerHTML = '';
  convo.forEach(m => {
    const paragraph = document.createElement('p');
    paragraph.className = 'message ' + (m.role === 'user' ? 'user' : 'model');
    console.log(marked.parse(m.text));
    paragraph.innerHTML = (m.role === 'user' ? 'You: ' : 'AI: ') + (m.role === 'model' ? marked.parse(m.text) : m.text);
    messagesEl.appendChild(paragraph);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendToBackend() {
  const history = convo.slice(-20);
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ convo: history })
  });
  if (!res.ok) throw new Error('Server error ' + res.status);
  const data = await res.json();
  return data.text || '[No response]';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';
  convo.push({ role: 'user', text });
  render();
  setLoading(true);
  try {
    const reply = await sendToBackend(text);
    convo.push({ role: 'model', text: reply });
  } catch (err) {
    convo.push({ role: 'model', text: 'Error: ' + err.message });
  } finally {
    setLoading(false);
    render();
  }
});

function setLoading(state) {
  userInput.disabled = state;
  form.querySelector('button').disabled = state;
  form.querySelector('button').textContent = state ? '...' : 'Send';
}

render();
