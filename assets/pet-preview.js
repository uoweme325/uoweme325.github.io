const choiceInputs = document.querySelectorAll('.character-input');
const previews = document.querySelectorAll('img[data-panel]');
const heroPet = document.querySelector('#hero-pet');
const petScene = document.querySelector('.pet-scene');

const featurePreviews = document.querySelector('.features');
const choiceLabel = document.querySelector('.character-choice');
const interactiveLight = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeTransition;

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

for (const input of choiceInputs) {
  input.addEventListener('change', () => {
    activeTransition?.skipTransition();
    const applySelection = async () => {
      const selected = document.querySelector('.character-input:checked');
      const card = selected.closest('.character');
      const name = card.querySelector('strong').textContent.trim();
      for (const preview of previews) {
        preview.src = `/assets/agentpet-1.6.4/${selected.value}-${preview.dataset.panel}.webp`;
      }
      heroPet.alt = `${name}等待确认，Codex 的状态气泡位于角色上方`;
      petScene.dataset.character = selected.value;
      featurePreviews.dataset.character = selected.value;
      choiceLabel.textContent = `界面预览已切换为${name}。`;
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
      // Rapid arrow-key selection can skip the previous visual snapshot.
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
