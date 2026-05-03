export async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load JSON: ${path}`);
  }
  return response.json();
}
