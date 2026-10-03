// ========== ОПРЕДЕЛЕНИЕ УСТРОЙСТВА ==========
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) || window.matchMedia("(pointer: coarse)").matches;
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ========== ВИБРАЦИЯ ==========
function vibrate(pattern = 15) {
  if ("vibrate" in navigator && isTouchDevice) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

// ========== СОЗДАНИЕ ЧАСТИЦ ==========
function createParticles(container, count) {
  if (!container || prefersReducedMotion) return;

  const particleCount = isMobile ? Math.floor(count * 0.6) : count;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 8 + "s";
    particle.style.animationDuration = 6 + Math.random() * 4 + "s";

    const size = 2 + Math.random() * 4;
    particle.style.width = size + "px";
    particle.style.height = size + "px";

    fragment.appendChild(particle);
  }

  container.appendChild(fragment);
}

createParticles(document.getElementById("particles"), 40);

// ========== ЛОГИКА ОТКРЫТКИ ==========
const envelope = document.getElementById("envelope");
const envelopeScreen = document.getElementById("envelopeScreen");
const videoScreen = document.getElementById("videoScreen");
const hintBottom = document.getElementById("hintBottom");

let isOpening = false;

function openEnvelope() {
  if (isOpening) return;
  isOpening = true;

  // Вибрация при открытии
  vibrate([20, 30, 40]);

  // Скрываем подсказку
  hintBottom.classList.add("hidden");

  // Анимация открытия конверта
  envelope.classList.add("open");

  // Переход к видео
  setTimeout(() => {
    envelopeScreen.classList.add("hidden");
    videoScreen.classList.add("visible");
    createParticles(document.getElementById("videoParticles"), 30);
  }, 1800);
}

// ========== УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК ТАПА/КЛИКА ==========
function addTapHandler(element, handler) {
  let touched = false;
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  element.addEventListener(
    "touchstart",
    (e) => {
      touched = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      vibrate(10);
    },
    { passive: true },
  );

  element.addEventListener("touchend", (e) => {
    if (!touched) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    const deltaTime = Date.now() - startTime;

    // Считаем тапом только если движение меньше 10px и время меньше 500мс
    if (deltaX < 10 && deltaY < 10 && deltaTime < 500) {
      e.preventDefault();
      handler(e);
    }

    touched = false;
  });

  element.addEventListener("click", (e) => {
    if (!touched) {
      handler(e);
    }
    touched = false;
  });
}

// Клик по открытке открывает её
addTapHandler(envelope, openEnvelope);

// ========== ЛОГИКА ВИДЕО ==========
const mainVideo = document.getElementById("mainVideo");
const playBtn = document.getElementById("playBtn");
const videoOverlay = document.getElementById("videoOverlay");

function playVideo() {
  vibrate(15);
  videoOverlay.classList.add("hidden");
  mainVideo.controls = true;

  const playPromise = mainVideo.play();

  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.warn("Автовоспроизведение не удалось:", error);
      videoOverlay.classList.remove("hidden");
      mainVideo.controls = false;
    });
  }
}

addTapHandler(playBtn, (e) => {
  e.stopPropagation();
  playVideo();
});

addTapHandler(videoOverlay, playVideo);

mainVideo.addEventListener("ended", () => {
  videoOverlay.classList.remove("hidden");
  mainVideo.controls = false;
});

// ========== ПАРАЛЛАКС ТОЛЬКО НА DESKTOP ==========
if (!isTouchDevice && !prefersReducedMotion) {
  let rafId = null;
  const wrapper = document.querySelector(".envelope-wrapper");

  document.addEventListener("mousemove", (e) => {
    if (envelopeScreen.classList.contains("hidden") || isOpening) return;

    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;

      if (wrapper) {
        wrapper.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    });
  });
}

// ========== ФИКС ДЛЯ МОБИЛЬНЫХ: 100vh ==========
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setVh();
window.addEventListener("resize", setVh);
window.addEventListener("orientationchange", () => {
  setTimeout(setVh, 100);
});

// ========== БЛОКИРОВКА СКРОЛЛА ==========
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.target === document.body || e.target.closest(".video-overlay")) {
      e.preventDefault();
    }
  },
  { passive: false },
);

// ========== ЗАЩИТА ОТ ДВОЙНОГО ТАПА ==========
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false },
);

// ========== АДАПТАЦИЯ ВИДЕО ПОД ОРИЕНТАЦИЮ ==========
mainVideo.addEventListener("loadedmetadata", () => {
  if (isMobile && mainVideo.videoHeight > mainVideo.videoWidth) {
    const wrapper = document.querySelector(".video-wrapper");
    if (wrapper) {
      wrapper.style.aspectRatio = "9 / 16";
      wrapper.style.maxWidth = "min(100%, 420px)";
    }
  }
});
