export async function readConfig() {
  const response = await fetch('featuresets.json');
  const data = await response.json();
  return data;
}
