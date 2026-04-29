# **DESIGN_CONVENTIONS.md**

````md
# Design Conventions

## 1. Semicolons

- All variables must end with a semicolon.
- This applies even when assigning functions.

```ts
const handleClick = () => {};
````

---

## 2. Functions Inside Components

* Inside functional components, use variables (`const`) for all functions.
* Do not use the `function` keyword inside components.

```ts
const handleSubmit = () => {
    // logic
};
```

---

## 3. Naming Conventions

### File Names

* Documentation files → **UPPER_SNAKE_CASE**

  * Example: `DESIGN_CONVENTIONS.md`

* Regular Code files → **kebab-case**

  * Example: `auth-service.ts`

* Component Code files → **TitleCase**

  * Example: `Login.tsx`, `Landing.ts`

---

### Identifiers

* Variables → **camelCase**
* Functions → **camelCase**
* Constant object keys → **UPPER_SNAKE_CASE**
* Constant values should use app/domain format. Role and status values use uppercase strings.

```ts
const userEmail = "";
const handleLogin = () => {};
```

---

## 4. Functional Components

* All components must use the following format:

```ts
export default function ComponentName() {
    return <div />;
}
```

* Do not use arrow functions for component declarations.

---

## 5. UI Interaction And Visual Style

* Anything clickable must use a pointer cursor on hover.
  * Example: `cursor-pointer`

* Clickable elements must show a visual pressing effect when clicked.
  * Prefer subtle active states such as `active:scale-[0.98]`, `active:translate-y-px`, or an equivalent pressed state that fits the component.

* The primary accent color is navy blue.

* Major text should use dark gray.

* Minor/supporting text should use light gray.

* Icons must come from `lucide-react` only.
  * Do not add inline SVG icons or icons from other libraries unless explicitly approved.

---

## Summary

* Use semicolons everywhere
* Use `const` for functions inside components
* Follow strict naming conventions
* Use `export default function` for all components
* Use pointer cursors and pressed states for clickable UI
* Use navy blue as the accent color
* Use dark gray for major text and light gray for minor text
* Use `lucide-react` for icons

```
