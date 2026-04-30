function clearNode(node) {
  if (!node) return node;
  node.replaceChildren();
  return node;
}

function appendFragment(parent, children = []) {
  if (!parent) return parent;
  const fragment = document.createDocumentFragment();
  for (const child of children) fragment.appendChild(child);
  parent.appendChild(fragment);
  return parent;
}

function getNode(selector, root = document) {
  return root.querySelector(selector);
}

function getNodes(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}
