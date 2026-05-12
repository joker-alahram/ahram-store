export function renderSearchBar(
  container,
  {
    value = '',
    placeholder = 'ابحث عن المنتجات أو الشركات',
    onInput = () => {},
    onFocus = () => {},
  } = {}
) {
  if (!container) return;

  const existingInput = container.querySelector('input');
  if (existingInput) {
    if (document.activeElement !== existingInput) {
      existingInput.value = value;
      existingInput.placeholder = placeholder;
    }
    return;
  }

  container.innerHTML = `
    <div class="searchbar-shell">
      <div class="searchbar-input-wrap">
        <span class="searchbar-icon">🔍</span>
        <input
          type="text"
          class="searchbar-input"
          placeholder="${placeholder}"
          value="${value}"
          dir="auto"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
      </div>
    </div>
  `;

  const input = container.querySelector('.searchbar-input');
  if (!input) return;

  input.addEventListener('input', (event) => {
    onInput(event.target.value);
  });

  input.addEventListener('focus', onFocus);
}
