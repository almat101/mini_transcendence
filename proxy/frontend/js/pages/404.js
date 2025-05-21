export function renderPageNotFound() {
  const root = document.getElementById("root");
  root.innerHTML = ""; // Clear previous content

  root.innerHTML += `
  <div id="not-found">
    <h1>404</h1>
    <p>page not found!</p>
  </div>
`;
}
