# vite-plugin-dedupe

Ensure only one copy of a package with global state ever exists 
in your bundle.

```ts
import dedupe from 'vite-plugin-dedupe'

export default {
  plugins: [
    dedupe(['react', 'react-dom']),
  ],
}
```
