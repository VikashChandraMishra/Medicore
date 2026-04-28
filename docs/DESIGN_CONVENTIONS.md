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

* Code files → **kebab-case**

  * Example: `login-page.tsx`, `auth-service.ts`

---

### Identifiers

* Variables → **camelCase**
* Functions → **camelCase**

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

## Summary

* Use semicolons everywhere
* Use `const` for functions inside components
* Follow strict naming conventions
* Use `export default function` for all components

```
