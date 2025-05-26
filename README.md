# Ollama GUI

A modern, user-friendly web interface for interacting with locally installed LLM models via Ollama. This project provides an intuitive chat interface that allows you to communicate with various language models running on your local machine.

## Features

- 🚀 Clean, modern chat interface
- 💬 Real-time streaming responses
- 🔄 Dynamic model switching
- 🎨 Markdown and code syntax highlighting
- 📱 Responsive design for all devices

## Prerequisites

1. [Node.js](https://nodejs.org/) (v18 or higher)
2. [Ollama](https://ollama.ai/) - for running LLM models locally

## Setup

1. Install Ollama and download your preferred models:
   
    Install Ollama from https://ollama.ai/ or run the following command:

   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
   Then pull your desired models, for example:

   ```bash
   ollama pull gemma:3b
   ```

2. Clone and set up the project:
   ```bash
   git clone git@github.com:khokonm/ollama-gui.git
   cd ollama-gui
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Select your preferred model from the dropdown menu in the header
2. Type your message in the input field
3. Press Enter or click the Send button to chat with the model
4. The model's responses will stream in real-time with proper formatting for code and markdown

## Development

This project is built with:
- [Next.js](https://nextjs.org/) - React framework
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - Code highlighting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Theme Toggle Feature (Manual Implementation Guide)

The following sections describe the changes needed to implement a manual theme toggle (light/dark modes) in the application. This guide is provided due to difficulties merging this feature automatically.

### 1. Changes for `app/page.js`

The following modifications are needed in `app/page.js` to manage and apply the theme:

**a. Add State Variable for Theme:**

Import `useState` and `useEffect` if not already imported. Add a state variable to hold the current theme:

```javascript
const [theme, setTheme] = useState('light'); // Default, will be updated by useEffect
```

**b. Initialize Theme on Mount:**

Add a `useEffect` hook to determine the initial theme based on localStorage or system preference:

```javascript
useEffect(() => {
  const savedTheme = localStorage.getItem('themePreference');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  }
  // Default to 'light' is already handled by useState initial value if above conditions aren't met
  // or if savedTheme is invalid.
}, []);
```

**c. Apply Theme and Persist on Change:**

Add another `useEffect` hook that runs whenever the `theme` state changes. This hook will update the `<html>` tag's `data-theme` attribute and save the preference to localStorage:

```javascript
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('themePreference', theme);
  } catch (error) {
    console.error("Failed to save theme preference to localStorage:", error);
  }
}, [theme]);
```

**d. Add Theme Toggle Handler Function:**

Create a function to toggle the theme state:

```javascript
const handleToggleTheme = () => {
  setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
};
```

**e. Add Theme Toggle Button in JSX:**

In the `return (...)` statement, within the header section (e.g., inside the `div` with class `styles.headerControls`), add the toggle button. Make sure it's placed appropriately among other controls like the model selector or clear history button.

```jsx
<button
  onClick={handleToggleTheme}
  className={styles.themeToggleButton}
  title={theme === 'light' ? "Switch to Dark Theme" : "Switch to Light Theme"}
>
  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
</button>
```
Ensure `styles.themeToggleButton` is a class you will define in `app/chat.module.css`.

### 2. Changes for `app/globals.css`

Modify `app/globals.css` to define theme variables based on the `data-theme` attribute on the `<html>` element.

**a. Define Light and Dark Theme Variables:**

Remove or comment out the existing `:root { ... }` and `@media (prefers-color-scheme: dark) { :root { ... } }` blocks that define `--background` and `--foreground`.

Replace them with explicit definitions for each theme using the `data-theme` attribute:

```css
/* Default/Fallback values (optional, as data-theme should always be set by JS) */
:root {
  --background: #ffffff; /* Light theme default background */
  --foreground: #171717; /* Light theme default foreground */
  /* Add any other global CSS variables your app uses that might not be theme-dependent */
}

html[data-theme='light'] {
  --background: #ffffff;
  --foreground: #171717;
  /* Define any other light-theme specific variables here */
  color-scheme: light;
}

html[data-theme='dark'] {
  --background: #0a0a0a;
  --foreground: #ededed;
  /* Define any other dark-theme specific variables here */
  color-scheme: dark;
}
```

**b. Ensure Body Styles Use These Variables:**

The existing `body` style should already use `var(--foreground)` and `var(--background)`. Verify this remains:

```css
body {
  color: var(--foreground);
  background: var(--background);
  /* other styles like font-family etc. */
}
```

**Note:** The `color-scheme` property helps the browser render UI elements like scrollbars and form controls consistent with the theme.

### 3. Changes for `app/chat.module.css`

Add styles for the theme toggle button to make it visually consistent with other header controls.

**a. Style the `.themeToggleButton`:**

Add the following CSS class definition to `app/chat.module.css`:

```css
.themeToggleButton {
  padding: 6px 12px;
  border-radius: 16px; /* Or match your existing button border-radius */
  background: var(--gray-alpha-200); /* Or your default button background */
  color: var(--foreground);
  font-size: 14px; /* Or match your existing button font-size */
  font-weight: 500;
  border: none; /* Or 1px solid var(--gray-alpha-200) if other buttons have borders */
  cursor: pointer;
  transition: background 0.2s;
  outline: none;
}

.themeToggleButton:hover {
  background: var(--gray-alpha-300); /* Or your button hover background */
}
```

**Note:** Adjust the specific values (padding, border-radius, font-size, background colors like `var(--gray-alpha-200)`, `var(--gray-alpha-300)`) to match the existing styles of buttons like `.modelDropdown` or `.clearHistoryButton` in your `app/chat.module.css` file for perfect visual consistency. The variables `--gray-alpha-200` and `--gray-alpha-300` might need to be defined in `app/globals.css` if they don't exist, or replaced with hardcoded color values that fit your theme.
