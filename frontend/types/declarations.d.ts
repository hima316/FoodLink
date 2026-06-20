// Tell TypeScript that importing any .css file is valid
// This is needed for third-party CSS like leaflet/dist/leaflet.css
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}