let activeVideo = null;
let container = null;
let panel = null;
let toggleBtn = null;
let isPanelVisible = false; // Começa minimizado para não atrapalhar

let enableCheckbox, startSlider, endSlider, startText, endText, timeDisplay;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Cria a estrutura que contém o Botão e o Painel
function createLooperUI() {
  if (document.getElementById('custom-looper-container')) return;

  // Container principal
  container = document.createElement('div');
  container.id = 'custom-looper-container';

  // Botão redondo (Trigger)
  toggleBtn = document.createElement('button');
  toggleBtn.className = 'custom-looper-toggle-btn';
  toggleBtn.innerHTML = '🔁';
  toggleBtn.title = 'Abrir controles de Loop';

  // Painel de controles
  panel = document.createElement('div');
  panel.className = 'custom-looper-panel';
  panel.style.display = isPanelVisible ? 'flex' : 'none'; // Aplica o estado atual
  panel.innerHTML = `
    <div class="custom-looper-header">
      <label>
        <input type="checkbox" id="looper-enable"> Loop A-B
      </label>
      <span id="looper-time-display">0:00 / 0:00</span>
    </div>
    <div class="custom-looper-row">
      <span>Início:</span>
      <input type="range" id="looper-start" class="custom-looper-slider" min="0" value="0" step="0.1">
      <span id="looper-start-text">0:00</span>
    </div>
    <div class="custom-looper-row">
      <span>Fim:</span>
      <input type="range" id="looper-end" class="custom-looper-slider" min="0" value="100" step="0.1">
      <span id="looper-end-text">0:00</span>
    </div>
  `;

  // Previne conflitos de cliques com os players dos sites
  const stopProp = (e) => e.stopPropagation();
  container.addEventListener('click', stopProp);
  container.addEventListener('mousedown', stopProp);
  container.addEventListener('keydown', stopProp);

  // Evento para alternar visualização do painel
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isPanelVisible = !isPanelVisible;
    panel.style.display = isPanelVisible ? 'flex' : 'none';
  });

  container.appendChild(toggleBtn);
  container.appendChild(panel);
  document.body.appendChild(container);

  // Mapeia os elementos internos
  enableCheckbox = document.getElementById('looper-enable');
  startSlider = document.getElementById('looper-start');
  endSlider = document.getElementById('looper-end');
  startText = document.getElementById('looper-start-text');
  endText = document.getElementById('looper-end-text');
  timeDisplay = document.getElementById('looper-time-display');

  // Ajustes de controle ao arrastar os seletores
  startSlider.addEventListener('input', () => {
    if (parseFloat(startSlider.value) >= parseFloat(endSlider.value)) {
      startSlider.value = parseFloat(endSlider.value) - 0.5;
    }
    startText.textContent = formatTime(startSlider.value);
  });

  endSlider.addEventListener('input', () => {
    if (parseFloat(endSlider.value) <= parseFloat(startSlider.value)) {
      endSlider.value = parseFloat(startSlider.value) + 0.5;
    }
    endText.textContent = formatTime(endSlider.value);
  });
}

// Loop de verificação constante (1 segundo)
setInterval(() => {
  const videos = document.querySelectorAll('video');
  const visibleVideos = Array.from(videos).filter(v => v.offsetHeight > 100);

  // Se não houver vídeos, esconde todo o container (inclusive o botão)
  if (visibleVideos.length === 0) {
    if (container) container.style.display = 'none';
    return;
  }

  // Cria a interface se ela ainda não existir na página
  createLooperUI();
  container.style.display = 'block';

  // Identifica o vídeo ativo
  let currentVideo = visibleVideos.find(v => !v.paused) || visibleVideos[0];

  if (currentVideo && currentVideo !== activeVideo) {
    activeVideo = currentVideo;
    activeVideo.dataset.looperDurationSet = 'false';
    startSlider.value = 0;
    startText.textContent = "0:00";
  }

  if (activeVideo) {
    const current = activeVideo.currentTime;
    const duration = activeVideo.duration;

    // Sincroniza a duração quando carregada
    if (duration && !isNaN(duration) && duration > 0 && activeVideo.dataset.looperDurationSet !== 'true') {
      startSlider.max = duration;
      endSlider.max = duration;
      endSlider.value = duration;
      endText.textContent = formatTime(duration);
      activeVideo.dataset.looperDurationSet = 'true';
    }

    timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

    // Monitoramento do Loop em segundo plano (funciona mesmo com painel oculto)
    if (enableCheckbox.checked) {
      const startLimit = parseFloat(startSlider.value);
      const endLimit = parseFloat(endSlider.value);

      if (current >= endLimit || current < startLimit) {
        activeVideo.currentTime = startLimit;
      }
    }
  }
}, 1000);