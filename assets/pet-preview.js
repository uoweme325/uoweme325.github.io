const choiceInputs = document.querySelectorAll('.character-input');
const stampInputs = document.querySelectorAll('input[name="stamp-style"]');
const quotaInputs = document.querySelectorAll('input[name="quota-state"]');
const previews = document.querySelectorAll('img[data-panel]');
const heroPet = document.querySelector('#hero-pet');
const petScene = document.querySelector('.pet-scene');
const initialCharacter = petScene.dataset.character;
const initialScene = heroPet.getAttribute('src');

const featurePreviews = document.querySelector('.features');
const choiceLabel = document.querySelector('.character-choice');
const sceneQuote = document.querySelector('#scene-quote');
const pokeBtn = document.querySelector('#pet-poke-btn');
const soundPreviewBtn = document.querySelector('#sound-preview-btn');
const detailPopover = document.querySelector('#work-detail-popover');
const detailTrigger = document.querySelector('.detail-trigger');
const detailPopoverBanner = document.querySelector('#detail-popover-banner');
const detailPopoverBody = document.querySelector('#detail-popover-body');

if (detailPopover && detailTrigger) {
  detailPopover.addEventListener('beforetoggle', event => {
    if (event.newState !== 'open') return;
    if (window.CSS && CSS.supports('position-area: bottom')) return;
    const rect = detailTrigger.getBoundingClientRect();
    detailPopover.style.top = `${rect.bottom + window.scrollY + 8}px`;
    detailPopover.style.left = `${Math.max(16, Math.min(rect.left + window.scrollX, window.innerWidth - 340))}px`;
  });
}

const interactiveLight = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const supportsScopedTransition = 'startViewTransition' in Element.prototype;
let activeTransition;
let activePanelTransition;
let quoteIndices = { claude: 0, dragon: 0, gemini: 0, deepseek: 0, zcode: 0 };
let preloadedUrls = new Set();

const roleQuotes = {
  claude: [
    ['「诗人的灵感可没有枯竭，红茶也正好泡好，', '今天咱们先从哪个模块动笔？」'],
    ['「五小时的午后红茶与茶点额度还很充裕，', '主人尽管放手去试，我替您兜底。」'],
    ['「发间的向日葵发饰歪了吗？', '咳、才不是因为刚才被主人夸奖才慌神呢……」'],
    ['「把橘白礼裙的荷叶袖口轻轻挽好——', '不管是重构还是排障，我都准备好了。」']
  ],
  dragon: [
    ['「Ciallo～', '今天也请多关照。」'],
    ['「角不许摸……', '刚才那次就算了。」'],
    ['「拍一拍我的脑袋，', '就破例给你看一眼今天的剩余额度哦。」'],
    ['「摸鱼中，勿扰~', '除非准备了香喷喷的高质量上下文！」']
  ],
  gemini: [
    ['「双子星的星轨已经对齐~', '超长上下文与跨文件联调尽管交给我！」'],
    ['「左眼看全局架构，右眼盯代码细节——', '这就是双子座搭档的天然默契哦~」'],
    ['「听，是构建全绿通过的清脆回音！', '给咱们今天的配合记上一颗亮星★」'],
    ['「别担心改动牵一发而动全身，', '我已经替您把上下游星轨都盯牢啦！」']
  ],
  deepseek: [
    ['「噗噜噜~ 大肥鱼端着小饭碗准时上班，', '今天也请多多关照！」'],
    ['「小鲸鱼尾巴轻轻拍桌：', '主人今天的 Token 饭碗还满着吗？」'],
    ['「别捏我鼓起来的腮帮子啦……', '再捏就把刚想好的推导步骤吐出来咯！」'],
    ['「只要按时投喂清晰的需求，', '整座深海的 Bug 我都能帮您捞上来。」']
  ],
  zcode: [
    ['「银铃轻响~ 智谱娘竖起黑色狐耳，', '随时准备替主人接管难缠的代码！」'],
    ['「Z 字菱形发饰已就位！', '今天要用哪一门语言开启新回合？」'],
    ['「左腕的黑扣袖带系紧，爪印笔记本翻开，', '智谱娘全速编码模式启动！」'],
    ['「夜再深也有狐耳和蓬松大尾巴暖着桌角，', '主人只管安心往前推进吧！」']
  ]
};

const roleDetailPreviews = {
  claude: {
    banner: '状态提示：正在执行多助手协同步骤（蟹爪徽记）',
    body: '已按典籍上的蓝图动笔改代码啦~ 正在核对 AgentPet.ps1 与样式改动，同源会话运行平稳。'
  },
  dragon: {
    banner: '状态提示：正在认真改文件（白龙徽记）',
    body: '收起懒腰认真干活中，连尾巴都绷直啦！正顺手检查测试脚本与打包依赖。'
  },
  gemini: {
    banner: '状态提示：多星轨并行同步（星猫徽记）',
    body: '正沿着星轨全速改代码，比流星还稳哦~ 已同步核对跨目录引用与界面响应式布局。'
  },
  deepseek: {
    banner: '状态提示：深水区编码推进（鲸鱼徽记）',
    body: '鲸尾轻轻拍打节拍——构建与修改同步推进中~ 正在校验本地余额与运行日志。'
  },
  zcode: {
    banner: '状态提示：爪印笔记本记录中（玄狐徽记）',
    body: '蓝光星芒闪过——构建与改动正有序执行呢！待会儿就能圆满交差啦。'
  }
};

function getSelectedRole() {
  const checked = document.querySelector('.character-input:checked');
  return checked ? checked.value : initialCharacter;
}

function getSelectedStampStyle() {
  const checked = document.querySelector('input[name="stamp-style"]:checked');
  return checked ? checked.value : 'embossed';
}

function getSelectedQuotaState() {
  const checked = document.querySelector('input[name="quota-state"]:checked');
  return checked ? checked.value : 'normal';
}

function getPanelSrc(role, panel, stampStyle, quotaState) {
  if (panel === 'scene') {
    return role === initialCharacter
      ? initialScene
      : `/assets/agentpet-1.6.4/${role}-scene.webp`;
  }
  if (panel === 'work') {
    const suffix = stampStyle === 'lineart' ? '-work-lineart' : '-work';
    return `/assets/agentpet-1.6.4/${role}${suffix}.webp?v=dsh-mark`;
  }
  if (panel === 'quota') {
    if (quotaState === 'low') {
      return `/assets/agentpet-1.6.4/${role}-quota-low.webp`;
    }
    const suffix = stampStyle === 'lineart' ? '-quota-lineart' : '-quota';
    return `/assets/agentpet-1.6.4/${role}${suffix}.webp`;
  }
  return `/assets/agentpet-1.6.4/${role}-${panel}.webp?v=dsh-mark`;
}

function preloadUrls(urls) {
  for (const url of urls) {
    if (!url || preloadedUrls.has(url)) continue;
    preloadedUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

function preloadRoleAssets(role, includeVariants = false) {
  const urls = [
    getPanelSrc(role, 'scene', 'embossed', 'normal'),
    getPanelSrc(role, 'work', 'embossed', 'normal'),
    `/assets/agentpet-1.6.4/${role}-quota.webp`,
    getPanelSrc(role, 'balance', 'embossed', 'normal')
  ];
  if (includeVariants) {
    urls.push(
      getPanelSrc(role, 'work', 'lineart', 'normal'),
      `/assets/agentpet-1.6.4/${role}-quota-lineart.webp`,
      `/assets/agentpet-1.6.4/${role}-quota-low.webp`
    );
  }
  preloadUrls(urls);
}

const MIN_PRESS_RELEASE_MS = 145;
const audioCache = {};
let isPetPressed = false;
let lastPressAt = 0;
let releaseTimer = 0;

function stopPreviewSound(file) {
  const audio = audioCache[file];
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Ignore media state errors.
  }
}

function playPreviewSound(file) {
  try {
    if (file === 'press.wav') {
      stopPreviewSound('release.wav');
    } else if (file === 'release.wav') {
      stopPreviewSound('press.wav');
    }
    let audio = audioCache[file];
    if (!audio) {
      audio = new Audio(`/assets/agentpet-1.6.4/${file}`);
      audio.volume = 0.65;
      audioCache[file] = audio;
    }
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  } catch {
    // Ignore autoplay restrictions or missing audio decode support.
  }
}

function updatePreviewPanels(role, name) {
  const stampStyle = getSelectedStampStyle();
  const quotaState = getSelectedQuotaState();
  for (const preview of previews) {
    preview.src = getPanelSrc(role, preview.dataset.panel, stampStyle, quotaState);
    if (preview.dataset.panel === 'quota') {
      preview.alt = quotaState === 'low'
        ? `${name}低额度票夹示例，5 小时剩余 25% 偏低，每周剩余 10% 紧张`
        : `${name}额度票夹示例，5 小时剩余 68%，每周剩余 84%（${stampStyle === 'lineart' ? '简笔画' : '正常'}）`;
    }
  }
  featurePreviews.dataset.character = role;
  featurePreviews.dataset.stampStyle = stampStyle;
  featurePreviews.dataset.quotaState = quotaState;

  if (detailPopoverBanner && detailPopoverBody && roleDetailPreviews[role]) {
    detailPopoverBanner.textContent = roleDetailPreviews[role].banner;
    detailPopoverBody.textContent = roleDetailPreviews[role].body;
  }
}

const quoteLeadEl = sceneQuote?.querySelector('.quote-lead');
const quoteTailEl = sceneQuote?.querySelector('.quote-tail');

function setSceneQuote(lead, tail) {
  if (!sceneQuote) return;
  if (quoteLeadEl && quoteTailEl) {
    quoteLeadEl.textContent = lead;
    quoteTailEl.textContent = tail;
  } else {
    sceneQuote.textContent = `${lead}${tail}`;
  }
}

function advanceCharacterQuote(role) {
  const list = roleQuotes[role] || roleQuotes.claude;
  const idx = quoteIndices[role] || 0;
  const [lead, tail] = list[idx % list.length];
  quoteIndices[role] = (idx + 1) % list.length;
  setSceneQuote(lead, tail);
}

function triggerBouncePose(withSound = true) {
  const role = getSelectedRole();
  heroPet.classList.remove('is-pressing');
  heroPet.classList.add('is-bouncing');
  window.setTimeout(() => {
    heroPet.classList.remove('is-bouncing');
  }, 160);
  if (withSound) {
    playPreviewSound('release.wav');
  }
  advanceCharacterQuote(role);
}

petScene.addEventListener('pointermove', event => {
  if (!interactiveLight.matches) return;
  const bounds = petScene.getBoundingClientRect();
  const lightX = (event.clientX - bounds.left) / bounds.width * 100;
  const lightY = (event.clientY - bounds.top) / bounds.height * 100;
  petScene.style.setProperty('--light-x', `${lightX}%`);
  petScene.style.setProperty('--light-y', `${lightY}%`);
});

petScene.addEventListener('pointerleave', () => {
  petScene.style.removeProperty('--light-x');
  petScene.style.removeProperty('--light-y');
});

function startPetPress() {
  if (releaseTimer) {
    window.clearTimeout(releaseTimer);
    releaseTimer = 0;
  }
  isPetPressed = true;
  lastPressAt = performance.now();
  heroPet.classList.remove('is-bouncing');
  heroPet.classList.add('is-pressing');
  playPreviewSound('press.wav');
}

function finishPetPress(withSound = true) {
  if (!isPetPressed) return;
  isPetPressed = false;
  const elapsed = performance.now() - lastPressAt;
  const remaining = Math.max(0, MIN_PRESS_RELEASE_MS - elapsed);
  if (remaining > 0) {
    releaseTimer = window.setTimeout(() => {
      releaseTimer = 0;
      triggerBouncePose(withSound);
    }, remaining);
    return;
  }
  triggerBouncePose(withSound);
}

function cancelPetPress() {
  if (releaseTimer) {
    window.clearTimeout(releaseTimer);
    releaseTimer = 0;
  }
  isPetPressed = false;
  heroPet.classList.remove('is-pressing');
}

heroPet.addEventListener('pointerdown', event => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  startPetPress();
});

heroPet.addEventListener('pointerup', () => {
  finishPetPress(true);
});

heroPet.addEventListener('pointercancel', cancelPetPress);

heroPet.addEventListener('pointerleave', () => {
  if (isPetPressed) {
    finishPetPress(true);
  }
});

if (pokeBtn) {
  pokeBtn.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    startPetPress();
  });
  pokeBtn.addEventListener('pointerup', () => {
    finishPetPress(true);
  });
  pokeBtn.addEventListener('pointercancel', cancelPetPress);
  pokeBtn.addEventListener('pointerleave', () => {
    if (isPetPressed) {
      finishPetPress(true);
    }
  });
  pokeBtn.addEventListener('click', event => {
    if (event.detail !== 0) return;
    startPetPress();
    finishPetPress(true);
  });
}

if (soundPreviewBtn) {
  soundPreviewBtn.addEventListener('click', () => {
    soundPreviewBtn.dataset.playing = 'true';
    playPreviewSound('task_complete.wav');
    setSceneQuote('已播放 v1.6.4 任务完成提示音，', '客户端支持免打扰与隐藏静音。');
    window.setTimeout(() => {
      delete soundPreviewBtn.dataset.playing;
    }, 900);
  });
}

for (const input of choiceInputs) {
  const card = input.closest('.character');
  if (card) {
    card.addEventListener('pointerenter', () => preloadRoleAssets(input.value, false), { once: true });
    card.addEventListener('focusin', () => preloadRoleAssets(input.value, false), { once: true });
  }
  input.addEventListener('change', () => {
    activeTransition?.skipTransition();
    const applySelection = async () => {
      const selected = document.querySelector('.character-input:checked');
      const selectedCard = selected.closest('.character');
      const name = selectedCard.querySelector('strong').textContent.trim();
      const role = selected.value;
      updatePreviewPanels(role, name);
      heroPet.alt = `${name}等待确认，Codex 的状态气泡位于角色上方`;
      petScene.dataset.character = role;
      choiceLabel.textContent = `界面预览已切换为${name}。`;
      advanceCharacterQuote(role);
      try {
        await heroPet.decode();
      } catch {
        // Interrupted decodes and failed image loads must not block selection.
      }
    };
    if (document.startViewTransition && !reducedMotion.matches) {
      heroPet.style.viewTransitionName = 'pet-portrait';
      const transition = document.startViewTransition(applySelection);
      activeTransition = transition;
      transition.ready.catch(() => {});
      transition.finished.then(() => {
        if (activeTransition !== transition) return;
        heroPet.style.removeProperty('view-transition-name');
        activeTransition = undefined;
      });
    } else {
      applySelection();
    }
  });
}

function handleBubbleVariantChange() {
  const role = getSelectedRole();
  const card = document.querySelector('.character-input:checked')?.closest('.character');
  const name = card ? card.querySelector('strong').textContent.trim() : '小克';
  const updateDOM = () => updatePreviewPanels(role, name);

  if (supportsScopedTransition && !reducedMotion.matches) {
    activePanelTransition?.skipTransition?.();
    const transition = featurePreviews.startViewTransition(updateDOM);
    activePanelTransition = transition;
    transition.ready.catch(() => {});
    transition.finished.then(() => {
      if (activePanelTransition !== transition) return;
      activePanelTransition = undefined;
    });
  } else {
    updateDOM();
  }
}

for (const input of [...stampInputs, ...quotaInputs]) {
  input.addEventListener('change', handleBubbleVariantChange);
}

const schedulePreload = window.requestIdleCallback || (cb => window.setTimeout(cb, 500));
schedulePreload(() => {
  preloadRoleAssets(initialCharacter, true);
  for (const input of choiceInputs) {
    if (input.value !== initialCharacter) {
      preloadRoleAssets(input.value, false);
    }
  }
});
