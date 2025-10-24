# Setting Up Jest Testing for Your LWC OSS Project

## Introduction

This guide will walk you through setting up Jest testing in your existing LWC OSS project from scratch, following the official [lwc.dev testing guide](https://lwc.dev/guide/test). We'll build our testing knowledge incrementally, starting with the basics and gradually adding more sophisticated testing patterns.

**What is Jest?** Jest is a JavaScript testing framework created by Facebook. It's designed to work with minimal configuration and provides everything you need to write tests: a test runner, assertion library, and mocking capabilities all in one package.

**Why Jest for LWC?** Salesforce provides official Jest support for Lightning Web Components through the `@lwc/jest-preset` package, making it the recommended testing framework for LWC projects.

---

## Prerequisites

✅ Node.js and npm are installed and working  
✅ You have an LWC OSS/LWR project set up  
✅ You can run your project and see a component display  

---

## Part 1: Installing Jest and LWC Testing Dependencies

We'll follow the official installation steps from lwc.dev, which recommends installing Jest along with all necessary LWC packages.

### Step 1.1: Install Core Dependencies

Open your terminal in your project's root directory and run this command to install Jest and the LWC testing packages:

```bash
npm install --save-dev jest @lwc/jest-preset @lwc/compiler @lwc/engine-dom @lwc/engine-server @lwc/synthetic-shadow
```

**What does this command do?**

- `npm install` - Downloads and installs packages
- `--save-dev` - Saves these as "development dependencies" (only needed for development, not production)
- `jest` - The testing framework itself
- `@lwc/jest-preset` - Jest configuration preset specifically for LWC, includes transformer, resolver, and serializer
- `@lwc/compiler` - Compiles LWC components during tests
- `@lwc/engine-dom` - LWC DOM rendering engine
- `@lwc/engine-server` - LWC server-side rendering engine
- `@lwc/synthetic-shadow` - Synthetic Shadow DOM implementation

**Why all these packages?** The `@lwc/jest-preset` package provides the base configuration for testing LWC components, while the compiler and engine packages allow Jest to understand and render your LWC components during tests.

### Step 1.2: Install jsdom (Jest 28+)

If you're using Jest version 28 or above, you also need to install `jest-environment-jsdom` separately:

```bash
npm install --save-dev jest-environment-jsdom
```

**What is jsdom?** Since a browser isn't running when tests run, Jest uses jsdom to provide an environment that behaves much like a browser's DOM or document. Jest has a dependency on jsdom, which is a Node.js project.

**How to check your Jest version:**

```bash
npm list jest
```

If you see version 28 or higher, you need jsdom. If lower, it's already included.

### Step 1.3: Verify Installation

After installation completes, check your `package.json` file. You should see these packages listed under `devDependencies`:

```json
{
  "devDependencies": {
    "jest": "^29.x.x",
    "@lwc/jest-preset": "^17.x.x",
    "@lwc/compiler": "^7.x.x",
    "@lwc/engine-dom": "^7.x.x",
    "@lwc/engine-server": "^7.x.x",
    "@lwc/synthetic-shadow": "^7.x.x",
    "jest-environment-jsdom": "^29.x.x"
  }
}
```

**Version numbers may differ** - that's okay! npm installs the latest compatible versions.

---

## Part 2: Configuring Jest for LWC

Now we need to tell Jest how to work with Lightning Web Components.

### Step 2.1: Create Jest Configuration File

The easiest way to configure your project is to use the preset configurations provided by `@lwc/jest-preset`. Create a file called `jest.config.js` in your project root:

```javascript
const { jestConfig } = require('@lwc/jest-preset');

module.exports = {
    ...jestConfig
};
```

**Understanding this code:**

- We import the default Jest configuration for LWC from the preset package
- `...jestConfig` is JavaScript spread syntax - it copies all the configuration settings
- This gives us all the LWC-specific Jest settings without having to write them ourselves

**What does this preset provide?** It configures:

- How to transform (compile) LWC components
- How to resolve LWC module imports
- How to serialize LWC elements in test output
- The jsdom test environment

### Step 2.2: Configure Module Paths

After you define a preset, update the `moduleNameMapper` entry of the Jest config to point to where your LWC components live. Update your `jest.config.js`:

```javascript
const { jestConfig } = require('@lwc/jest-preset');

module.exports = {
    ...jestConfig,
    moduleNameMapper: {
        // Adjust this path to match where YOUR components are located
        '^c/(.+)$': '<rootDir>/src/modules/c/$1/$1'
    }
};
```

**Understanding moduleNameMapper:**

- The left side (`'^c/(.+)$'`) is a regular expression pattern that matches imports like `import MyComponent from 'c/myComponent'`
- `c` is the namespace (common in LWR projects; could be different in your project)
- `(.+)` captures the component name
- The right side tells Jest where to actually find those files
- `<rootDir>` is Jest's placeholder for your project root directory
- `$1/$1` means if you import `c/myComponent`, it looks in `src/modules/c/myComponent/myComponent.js`

**Important:** Adjust the path to match your project structure. Common alternatives:

- LWR projects: `<rootDir>/src/modules/c/$1/$1` (or your custom namespace)
- Different folder structure: `<rootDir>/src/client/modules/c/$1/$1`

**How to find your path:**

1. Navigate to where one of your components lives
2. Note the path from your project root
3. Replace the component name with `$1/$1`

### Step 2.3: Add Test Scripts

To run tests, add scripts to `package.json`. Open your `package.json` and add these to the `"scripts"` section:

```json
{
  "scripts": {
    "test:unit": "jest",
    "test:unit:watch": "jest --watch"
  }
}
```

**What do these scripts do?**

- `test:unit` - Runs all tests once
- `test:unit:watch` - Automatically re-runs tests related to files that have changed

**Why use npm scripts?**

- Provides a consistent way to run tests across your team
- Shorter to type than `npx jest`
- Easy to add more options later

---

## Part 3: Writing Your First LWC Test

Now that Jest is configured, let's create a simple component and test it.

### Step 3.1: Create a Simple Component

In your components directory, create a new component called `greeting`. Create these files:

**File: `src/modules/c/greeting/greeting.js`**

```javascript
import { LightningElement } from 'lwc';

export default class Greeting extends LightningElement {
    greeting = 'Hello, World!';
}
```

**File: `src/modules/c/greeting/greeting.html`**

```html
<template>
    <div class="greeting">{greeting}</div>
</template>
```

**Note:** Adjust the file path if your components are in a different location!

### Step 3.2: Create the Test Directory

Create a folder named `__tests__` at the top level of your component's bundle directory.

```bash
mkdir src/modules/c/greeting/__tests__
```

**Why `__tests__`?** Jest runs JavaScript files in the `__tests__` directory. This is a convention that Jest automatically recognizes.

### Step 3.3: Write Your First Test

Test files must have names that end in `.js`, and we recommend that tests end in `.test.js`.

Create this file: `src/modules/c/greeting/__tests__/greeting.test.js`

```javascript
// Import the function to create components in tests
import { createElement } from 'lwc';
// Import the component we want to test
import Greeting from 'c/greeting';

// Describe groups related tests together
describe('c-greeting', () => {
    // This test verifies the component renders correctly
    it('displays the greeting message', () => {
        // ARRANGE: Create the component
        const element = createElement('c-greeting', {
            is: Greeting
        });
        
        // Add it to the test DOM
        document.body.appendChild(element);

        // ACT: Query for the element we want to check
        const div = element.shadowRoot.querySelector('.greeting');

        // ASSERT: Check if it has the expected content
        expect(div.textContent).toBe('Hello, World!');
    });
});
```

**Understanding the test structure:**

1. **`import { createElement } from 'lwc'`**  
   This utility function creates component instances for testing.

2. **`import Greeting from 'c/greeting'`**  
   Imports your component. The path must match what you configured in `moduleNameMapper`.

3. **`describe('c-greeting', () => {...})`**  
   A describe block defines a test suite. A test suite contains one or more tests that belong together from a functional point of view. We recommend naming it after your component.

4. **`it('displays the greeting message', () => {...})`**  
   An `it` block describes a single test. A test represents a single functional unit that you want to test.

5. **`createElement('c-greeting', { is: Greeting })`**  
   Creates an instance of your component. First parameter is the tag name, second specifies which component class to use.

6. **`document.body.appendChild(element)`**  
   The `document.body.appendChild()` call attaches the Lightning web component to the DOM and renders it. Which also means that `renderedCallback()` lifecycle method gets called.

7. **`element.shadowRoot.querySelector()`**  
   Use `element.shadowRoot` as the parent for the query. It's a test-only API that lets you peek across the shadow boundary to inspect a component's shadow tree. It's the test equivalent of `this.template`.

8. **`expect(div.textContent).toBe('Hello, World!')`**  
   The expect statement is an assertion of the success condition: that the text of the element is "Hello, World!"

### Step 3.4: Run Your First Test

```bash
npm run test:unit
```

You should see output like:

```bash
PASS  src/modules/c/greeting/__tests__/greeting.test.js
  c-greeting
    ✓ displays the greeting message (15 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

🎉 **Success!** You've just run your first LWC test!

**Troubleshooting:**

- **"Cannot find module 'c/greeting'"** - Check your `moduleNameMapper` path in `jest.config.js`. Make sure it matches where your components actually are.
- **"SyntaxError: Unexpected token"** - Jest might not be transforming your files correctly. Verify `@lwc/jest-preset` is installed.
- **Test fails** - Double-check that the component files are in the correct location and that the class names match.

---

## Part 4: Test Cleanup and Best Practices

### Step 4.1: Understanding the DOM Pollution Problem

Each test file shares a single instance of jsdom, and changes aren't reset between tests inside the file. Therefore it's a best practice to clean up between tests, so that a test's output doesn't affect any other test.

Let's see this problem. Add another test to `greeting.test.js`:

```javascript
describe('c-greeting', () => {
    it('displays the greeting message', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        const div = element.shadowRoot.querySelector('.greeting');
        expect(div.textContent).toBe('Hello, World!');
    });

    it('has only one greeting component', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        // This will fail - it finds TWO components!
        const allGreetings = document.body.querySelectorAll('c-greeting');
        expect(allGreetings.length).toBe(1);
    });
});
```

Run the tests:

```bash
npm run test:unit
```

The second test fails! It finds 2 greeting elements because we didn't clean up after the first test.

### Step 4.2: Add Cleanup with afterEach

The Jest `afterEach()` method resets the DOM at the end of the test. Update your test file:

```javascript
import { createElement } from 'lwc';
import Greeting from 'c/greeting';

describe('c-greeting', () => {
    // Clean up after EACH test
    afterEach(() => {
        // Remove all children from the document body
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('displays the greeting message', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        const div = element.shadowRoot.querySelector('.greeting');
        expect(div.textContent).toBe('Hello, World!');
    });

    it('has only one greeting component', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        const allGreetings = document.body.querySelectorAll('c-greeting');
        expect(allGreetings.length).toBe(1);
    });
});
```

Run the tests again:

```bash
npm run test:unit
```

Both tests pass! ✅

**Understanding afterEach:**

- Runs automatically after each `it()` test
- Ensures a clean slate for the next test
- Prevents test pollution (tests affecting each other)

**Best Practice:** We recommend having a top level describe block with a description matching the component name and always include `afterEach` cleanup in your component tests.

---

## Part 5: Test-Driven Development (TDD) - Building a Counter

Now let's practice **Test-Driven Development** by building a counter component. In TDD, we write tests BEFORE writing the code.

**The TDD Cycle:**

1. **Red** - Write a failing test
2. **Green** - Write minimal code to pass the test
3. **Refactor** - Improve the code while keeping tests green

### Step 5.1: Write the First Failing Test (RED)

Let's start by imagining what we want: a counter that starts at 0.

First, create the component directory and an empty JavaScript file:

```bash
mkdir -p src/modules/c/counter/__tests__
```

Create `src/modules/c/counter/counter.js` (just an empty shell for now):

```javascript
import { LightningElement } from 'lwc';

export default class Counter extends LightningElement {
    // Empty for now - we'll add code after the test fails
}
```

Now create the test file `src/modules/c/counter/__tests__/counter.test.js`:

```javascript
import { createElement } from 'lwc';
import Counter from 'c/counter';

describe('c-counter', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    // Our first requirement: counter starts at 0
    it('displays initial count of 0', () => {
        // ARRANGE
        const element = createElement('c-counter', {
            is: Counter
        });
        document.body.appendChild(element);

        // ACT
        const display = element.shadowRoot.querySelector('.count-display');

        // ASSERT
        expect(display.textContent).toBe('0');
    });
});
```

**Understanding Arrange-Act-Assert:**

- **Arrange**: Set up the test - create the component
- **Act**: Perform the action - query for elements
- **Assert**: Verify the result - check expectations

Run the test:

```bash
npm run test:unit counter
```

**It fails!** ❌ That's expected - we haven't created the template yet. The test is "driving" us to write the code.

**Why this is good:** The test tells us exactly what we need to build.

### Step 5.2: Write Minimal Code to Pass (GREEN)

Create `src/modules/c/counter/counter.html`:

```html
<template>
    <div>
        <div class="count-display">{count}</div>
    </div>
</template>
```

Update `src/modules/c/counter/counter.js`:

```javascript
import { LightningElement } from 'lwc';

export default class Counter extends LightningElement {
    count = 0;
}
```

Run the test:

```bash
npm run test:unit counter
```

**It passes!** ✅ We've completed one TDD cycle.

**What we learned:**

- The test guided our implementation
- We only wrote the minimum code needed
- We have proof the code works

### Step 5.3: Add Increment Feature (Another TDD Cycle)

Now let's add a button to increment the counter. Test first!

Add this test to `counter.test.js`:

```javascript
it('increments count when increment button is clicked', () => {
    // ARRANGE
    const element = createElement('c-counter', {
        is: Counter
    });
    document.body.appendChild(element);

    // ACT
    const button = element.shadowRoot.querySelector('.increment-btn');
    button.click();

    // ASSERT
    const display = element.shadowRoot.querySelector('.count-display');
    expect(display.textContent).toBe('1');
});
```

Run tests - it fails ❌ (no button exists).

Now add the button to make it pass. Update `counter.html`:

```html
<template>
    <div>
        <div class="count-display">{count}</div>
        <button class="increment-btn" onclick={handleIncrement}>
            Increment
        </button>
    </div>
</template>
```

Update `counter.js`:

```javascript
import { LightningElement } from 'lwc';

export default class Counter extends LightningElement {
    count = 0;

    handleIncrement() {
        this.count = this.count + 1;
    }
}
```

Run tests:

```bash
npm run test:unit counter
```

Both tests pass! ✅

### Step 5.4: Add Decrement Feature (Practice TDD)

Let's add one more feature. Add this test to `counter.test.js`:

```javascript
it('decrements count when decrement button is clicked', () => {
    // ARRANGE
    const element = createElement('c-counter', {
        is: Counter
    });
    document.body.appendChild(element);

    // Set count to 5 so we can decrement
    const incrementBtn = element.shadowRoot.querySelector('.increment-btn');
    incrementBtn.click();
    incrementBtn.click();
    incrementBtn.click();
    incrementBtn.click();
    incrementBtn.click();

    // ACT
    const decrementBtn = element.shadowRoot.querySelector('.decrement-btn');
    decrementBtn.click();

    // ASSERT
    const display = element.shadowRoot.querySelector('.count-display');
    expect(display.textContent).toBe('4');
});
```

Test fails ❌. Now implement it:

Update `counter.html`:

```html
<template>
    <div>
        <div class="count-display">{count}</div>
        <button class="increment-btn" onclick={handleIncrement}>
            Increment
        </button>
        <button class="decrement-btn" onclick={handleDecrement}>
            Decrement
        </button>
    </div>
</template>
```

Update `counter.js`:

```javascript
import { LightningElement } from 'lwc';

export default class Counter extends LightningElement {
    count = 0;

    handleIncrement() {
        this.count = this.count + 1;
    }

    handleDecrement() {
        this.count = this.count - 1;
    }
}
```

Run tests - all pass! ✅

**You just practiced TDD!** Notice how:

- Tests guide what code to write
- You write minimal code to pass each test
- Tests act as documentation of how the component should work
- You have confidence the code works because tests verify it

**Further Reading:**

- [Test-Driven Development Basics](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## Part 6: Behavior-Driven Development (BDD) - Building a Todo List

**BDD** focuses on describing the *behavior* of your application in human-readable terms using:

- Nested `describe()` blocks to group behaviors
- Clear, descriptive test names
- Given-When-Then structure

### Step 6.1: Plan the Behaviors

Before writing any code, let's describe what our todo list should do.

Create the directory:

```bash
mkdir -p src/modules/c/todoList/__tests__
```

Create `src/modules/c/todoList/__tests__/todoList.test.js`:

```javascript
import { createElement } from 'lwc';
import TodoList from 'c/todoList';

describe('c-todo-list', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    // BDD: Describe behaviors in nested groups
    describe('when the component first loads', () => {
        it('should display an empty list', () => {
            // Test will go here
        });

        it('should show a message saying no todos exist', () => {
            // Test will go here
        });
    });

    describe('when adding a new todo', () => {
        it('should add the todo to the list', () => {
            // Test will go here
        });

        it('should clear the input field', () => {
            // Test will go here
        });
    });
});
```

**Notice:** We're using nested describe blocks that group functionality. Our tests read like specifications - this is BDD.

### Step 6.2: Implement the First Behavior

Let's implement "should display an empty list". Update the test:

```javascript
describe('when the component first loads', () => {
    it('should display an empty list', () => {
        // GIVEN: A new todo list component
        const element = createElement('c-todo-list', {
            is: TodoList
        });
        document.body.appendChild(element);

        // WHEN: We check for todo items
        const items = element.shadowRoot.querySelectorAll('.todo-item');

        // THEN: There should be zero items
        expect(items.length).toBe(0);
    });
});
```

**Notice the Given-When-Then comments.** This is a BDD pattern that makes tests read like user scenarios.

Create the component files:

**File: `src/modules/c/todoList/todoList.js`**

```javascript
import { LightningElement } from 'lwc';

export default class TodoList extends LightningElement {
    todos = [];
}
```

**File: `src/modules/c/todoList/todoList.html`**

```html
<template>
    <div>
        <template for:each={todos} for:item="todo">
            <div key={todo.id} class="todo-item">
                {todo.text}
            </div>
        </template>
    </div>
</template>
```

Run the test:

```bash
npm run test:unit todoList
```

It passes! ✅

### Step 6.3: Add Empty State Message

Implement the second test:

```javascript
it('should show a message saying no todos exist', () => {
    // GIVEN: A new todo list component
    const element = createElement('c-todo-list', {
        is: TodoList
    });
    document.body.appendChild(element);

    // WHEN: The list is empty (it starts empty)

    // THEN: An empty message should be visible
    const emptyMsg = element.shadowRoot.querySelector('.empty-message');
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg.textContent).toContain('No todos yet');
});
```

Test fails ❌. Update the component:

**Update `todoList.html`:**

```html
<template>
    <div>
        <template if:true={isEmpty}>
            <p class="empty-message">No todos yet</p>
        </template>

        <template for:each={todos} for:item="todo">
            <div key={todo.id} class="todo-item">
                {todo.text}
            </div>
        </template>
    </div>
</template>
```

**Update `todoList.js`:**

```javascript
import { LightningElement } from 'lwc';

export default class TodoList extends LightningElement {
    todos = [];

    get isEmpty() {
        return this.todos.length === 0;
    }
}
```

Tests pass! ✅

### Step 6.4: Add Todo Creation (Async Testing)

Now the interesting part - adding todos requires handling user input and component re-rendering.

Add this test:

```javascript
describe('when adding a new todo', () => {
    it('should add the todo to the list', async () => {
        // GIVEN: A todo list with an input field
        const element = createElement('c-todo-list', {
            is: TodoList
        });
        document.body.appendChild(element);

        // WHEN: User types in the input and clicks add
        const input = element.shadowRoot.querySelector('.todo-input');
        const button = element.shadowRoot.querySelector('.add-button');
        
        input.value = 'Buy groceries';
        input.dispatchEvent(new CustomEvent('change'));
        button.click();

        // Wait for component to re-render
        await Promise.resolve();

        // THEN: The todo appears in the list
        const items = element.shadowRoot.querySelectorAll('.todo-item');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('Buy groceries');
    });
});
```

**New concepts:**

1. **`async` function**  
   The test function is marked `async` so we can use `await`.

2. **`await Promise.resolve()`**  
   LWC components re-render asynchronously. This waits for the next "tick", letting the component update the DOM.

3. **Simulating user input**
   - Set `input.value` to simulate typing
   - Call `dispatchEvent(new CustomEvent('change'))` to trigger the change event
   - Call `button.click()` to simulate clicking

Test fails ❌. Let's implement it:

**Update `todoList.html`:**

```html
<template>
    <div>
        <div class="input-section">
            <input 
                type="text" 
                class="todo-input"
                value={newTodoText}
                onchange={handleInputChange}
            />
            <button class="add-button" onclick={handleAddTodo}>
                Add
            </button>
        </div>

        <template if:true={isEmpty}>
            <p class="empty-message">No todos yet</p>
        </template>

        <template for:each={todos} for:item="todo">
            <div key={todo.id} class="todo-item">
                {todo.text}
            </div>
        </template>
    </div>
</template>
```

**Update `todoList.js`:**

```javascript
import { LightningElement } from 'lwc';

export default class TodoList extends LightningElement {
    todos = [];
    newTodoText = '';
    nextId = 1;

    get isEmpty() {
        return this.todos.length === 0;
    }

    handleInputChange(event) {
        this.newTodoText = event.target.value;
    }

    handleAddTodo() {
        if (this.newTodoText.trim() !== '') {
            this.todos = [
                ...this.todos,
                {
                    id: this.nextId++,
                    text: this.newTodoText
                }
            ];
            this.newTodoText = '';
        }
    }
}
```

Run tests:

```bash
npm run test:unit todoList
```

Tests pass! ✅

### Step 6.5: Verify Input Clears

Add one more test:

```javascript
it('should clear the input field', async () => {
    // GIVEN: A todo list
    const element = createElement('c-todo-list', {
        is: TodoList
    });
    document.body.appendChild(element);

    // WHEN: User adds a todo
    const input = element.shadowRoot.querySelector('.todo-input');
    const button = element.shadowRoot.querySelector('.add-button');
    
    input.value = 'Buy groceries';
    input.dispatchEvent(new CustomEvent('change'));
    button.click();

    await Promise.resolve();

    // THEN: Input should be empty
    expect(input.value).toBe('');
});
```

Run tests - they all pass! ✅ Our implementation already handles this.

**You just practiced BDD!** Notice how:

- Tests read like user stories
- We describe behaviors, not implementation details
- Given-When-Then makes tests clear
- Nested describe blocks organize related behaviors
- Tests act as living documentation

**Further Reading:**

- [Behavior-Driven Development](https://cucumber.io/docs/bdd/)
- [Given-When-Then by Martin Fowler](https://martinfowler.com/bliki/GivenWhenThen.html)

---

## Part 7: Running Tests Efficiently

### Step 7.1: Watch Mode for Active Development

When actively developing, you don't want to manually run tests every time you make a change. Jest has a "watch mode" that automatically re-runs tests when files change.

We already added this script in Part 2. Run it now:

```bash
npm run test:unit:watch
```

**What happens:**

- Jest starts in interactive mode
- Tests automatically re-run when you save files
- You can press keys to filter which tests run:
  - Press `a` to run all tests
  - Press `f` to run only failed tests
  - Press `p` to filter by filename
  - Press `t` to filter by test name
  - Press `q` to quit watch mode

**Why this is useful for TDD:**

- Immediate feedback when you save code
- See tests turn from red ❌ to green ✅ instantly
- Speeds up the TDD cycle dramatically
- No need to manually run `npm run test:unit` after every change

**Try it:** With watch mode running, open one of your component files and make a small change. Save the file and watch the tests automatically run!

### Step 7.2: Run Specific Tests

You don't always want to run all tests. Jest provides several ways to run specific tests:

**Run tests for one component:**

```bash
npm run test:unit counter
```

**Run a specific test file:**

```bash
npm run test:unit counter.test.js
```

**Run tests matching a pattern:**

```bash
npm run test:unit todo
```

This is especially useful as your test suite grows larger.

### Step 7.3: Run Only Specific Tests During Development

Sometimes you want to focus on just one test while developing. Jest provides two helpful methods:

**`it.only()` - Run only this test:**

```javascript
describe('c-counter', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    // This test will run
    it.only('displays initial count of 0', () => {
        const element = createElement('c-counter', {
            is: Counter
        });
        document.body.appendChild(element);

        const display = element.shadowRoot.querySelector('.count-display');
        expect(display.textContent).toBe('0');
    });

    // This test will be skipped
    it('increments count when increment button is clicked', () => {
        // ... test code
    });
});
```

**`it.skip()` - Skip this test:**

```javascript
describe('c-counter', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    // This test will run
    it('displays initial count of 0', () => {
        // ... test code
    });

    // This test will be skipped
    it.skip('increments count when increment button is clicked', () => {
        // ... test code
    });
});
```

**Important:** Remember to remove `.only()` and `.skip()` before committing your code!

### Step 7.4: Check Test Coverage

Coverage shows which parts of your code are tested. Add this script to your `package.json`:

```json
{
  "scripts": {
    "test:unit": "jest",
    "test:unit:watch": "jest --watch",
    "test:unit:coverage": "jest --coverage"
  }
}
```

Run it:

```bash
npm run test:unit:coverage
```

You'll see a table in your terminal showing:

```bash
------------|---------|----------|---------|---------|-------------------
File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------|---------|----------|---------|---------|-------------------
All files   |     100 |      100 |     100 |     100 |                   
 counter.js |     100 |      100 |     100 |     100 |                   
 todoList.js|     100 |      100 |     100 |     100 |                   
------------|---------|----------|---------|---------|-------------------
```

**Understanding the columns:**

- **% Stmts** (Statements) - How many lines of code were executed
- **% Branch** - How many if/else paths were tested
- **% Funcs** (Functions) - How many functions were called
- **% Lines** - Similar to statements, counts executable lines
- **Uncovered Line #s** - Which specific lines weren't tested

**Visual Coverage Report:**

A detailed HTML report is also generated in `coverage/lcov-report/index.html`. Open this in a browser to see:

- Color-coded source code (green = tested, red = untested)
- Click through to see exactly which lines aren't covered
- Drill down into specific files

**When to check coverage:**

- After implementing a feature
- Before submitting code for review
- To identify untested code paths
- When you want to find edge cases you haven't considered

**Important Note:** 100% coverage doesn't mean perfect tests, but low coverage definitely indicates missing tests. Aim for high coverage, but focus on testing meaningful behaviors.

---

## Part 8: Understanding Common Jest Matchers

Jest provides many ways to assert conditions. Here are the most common ones you'll use in LWC testing:

### Step 8.1: Equality Matchers

```javascript
// Exact equality (same value and type)
expect(element.count).toBe(5);
expect(element.name).toBe('John');

// Object/array equality (compares contents)
expect(element.todos).toEqual([
    { id: 1, text: 'Buy milk' },
    { id: 2, text: 'Walk dog' }
]);

// Not equal
expect(element.count).not.toBe(0);
```

**When to use:**

- Use `.toBe()` for primitive values (strings, numbers, booleans)
- Use `.toEqual()` for objects and arrays
- Use `.not` to negate any matcher

### Step 8.2: Truthiness Matchers

```javascript
// Check if value exists
expect(element).not.toBeNull();
expect(element).toBeDefined();
expect(element).not.toBeUndefined();

// Check boolean values
expect(element.isVisible).toBeTruthy();
expect(element.isHidden).toBeFalsy();
expect(element.isActive).toBe(true); // More explicit
```

**When to use:**

- Use `.toBeNull()` when checking if something doesn't exist
- Use `.toBeDefined()` to verify a variable was initialized
- Use `.toBeTruthy()/.toBeFalsy()` for general boolean checks

### Step 8.3: String Matchers

```javascript
// Check if string contains substring
expect(div.textContent).toContain('Hello');

// Check with regex
expect(div.textContent).toMatch(/hello/i);

// Exact match
expect(div.textContent).toBe('Hello, World!');
```

**When to use:**

- Use `.toContain()` when you only care about part of the string
- Use `.toMatch()` for pattern matching
- Use `.toBe()` when the exact string matters

### Step 8.4: Number Matchers

```javascript
// Greater than / less than
expect(element.count).toBeGreaterThan(0);
expect(element.count).toBeGreaterThanOrEqual(1);
expect(element.count).toBeLessThan(10);
expect(element.count).toBeLessThanOrEqual(10);

// Floating point comparison
expect(element.price).toBeCloseTo(19.99, 2); // Within 2 decimal places
```

### Step 8.5: Array and Collection Matchers

```javascript
const items = element.shadowRoot.querySelectorAll('.item');

// Check array length
expect(items.length).toBe(3);

// Check if array contains item
expect(element.todos).toContain('Buy milk');

// Check if array contains object with properties
expect(element.todos).toContainEqual({ id: 1, text: 'Buy milk' });
```

### Step 8.6: Exception Matchers

```javascript
// Check if function throws error
expect(() => {
    element.processInvalidData();
}).toThrow();

// Check specific error message
expect(() => {
    element.processInvalidData();
}).toThrow('Invalid data format');
```

**When to use:** When testing error handling in your components.

**Further Reading:**

- [Jest Expect API](https://jestjs.io/docs/expect) - Complete list of all matchers

---

## Part 9: Testing Patterns and Best Practices

### Step 9.1: The Arrange-Act-Assert Pattern

Every test should follow this pattern:

```javascript
it('should do something', () => {
    // ARRANGE - Set up test conditions
    const element = createElement('c-my-component', {
        is: MyComponent
    });
    document.body.appendChild(element);

    // ACT - Perform the action being tested
    const button = element.shadowRoot.querySelector('button');
    button.click();

    // ASSERT - Verify the result
    const result = element.shadowRoot.querySelector('.result');
    expect(result.textContent).toBe('Success');
});
```

**Why this matters:**

- Makes tests easier to read
- Clear separation of concerns
- Easy to identify what's being tested

### Step 9.2: One Assertion Per Test (Mostly)

**Good - Focused test:**

```javascript
it('displays the user name', () => {
    const element = createElement('c-user-card', { is: UserCard });
    element.user = { name: 'John Doe' };
    document.body.appendChild(element);

    const nameElement = element.shadowRoot.querySelector('.name');
    expect(nameElement.textContent).toBe('John Doe');
});

it('displays the user email', () => {
    const element = createElement('c-user-card', { is: UserCard });
    element.user = { email: 'john@example.com' };
    document.body.appendChild(element);

    const emailElement = element.shadowRoot.querySelector('.email');
    expect(emailElement.textContent).toBe('john@example.com');
});
```

**Acceptable - Related assertions:**

```javascript
it('displays all user information', () => {
    const element = createElement('c-user-card', { is: UserCard });
    element.user = { name: 'John Doe', email: 'john@example.com' };
    document.body.appendChild(element);

    const nameElement = element.shadowRoot.querySelector('.name');
    const emailElement = element.shadowRoot.querySelector('.email');
    
    // These are testing the same behavior, so grouping is OK
    expect(nameElement.textContent).toBe('John Doe');
    expect(emailElement.textContent).toBe('john@example.com');
});
```

**Why:** If a test with multiple unrelated assertions fails, it's harder to know exactly what broke.

### Step 9.3: Test Behavior, Not Implementation

**Bad - Testing implementation details:**

```javascript
it('calls handleClick when button is clicked', () => {
    const element = createElement('c-my-component', { is: MyComponent });
    document.body.appendChild(element);

    // Don't test private methods directly
    const spy = jest.spyOn(element, 'handleClick');
    const button = element.shadowRoot.querySelector('button');
    button.click();

    expect(spy).toHaveBeenCalled();
});
```

**Good - Testing behavior:**

```javascript
it('displays success message when button is clicked', () => {
    const element = createElement('c-my-component', { is: MyComponent });
    document.body.appendChild(element);

    const button = element.shadowRoot.querySelector('button');
    button.click();

    const message = element.shadowRoot.querySelector('.message');
    expect(message.textContent).toBe('Success!');
});
```

**Why:** Tests should care about *what* the component does, not *how* it does it. This makes refactoring easier.

### Step 9.4: Use Descriptive Test Names

**Bad:**

```javascript
it('works', () => { /* ... */ });
it('test 1', () => { /* ... */ });
it('button click', () => { /* ... */ });
```

**Good:**

```javascript
it('displays error message when input is empty', () => { /* ... */ });
it('disables submit button when form is invalid', () => { /* ... */ });
it('increments counter by 1 when increment button is clicked', () => { /* ... */ });
```

**Why:** Good test names serve as documentation. When a test fails, the name should tell you what broke.

### Step 9.5: Async Testing Best Practices

When testing async behavior, always wait for updates:

```javascript
it('displays data after loading', async () => {
    const element = createElement('c-data-loader', { is: DataLoader });
    document.body.appendChild(element);

    const button = element.shadowRoot.querySelector('.load-button');
    button.click();

    // IMPORTANT: Wait for async operations
    await Promise.resolve();

    const data = element.shadowRoot.querySelector('.data');
    expect(data).not.toBeNull();
});
```

**When to use `await Promise.resolve()`:**

- After triggering events (clicks, input changes)
- After setting reactive properties
- When the component needs to re-render
- After any async operation

**Common mistake:** Forgetting `await` causes tests to check the DOM before it updates, leading to false failures.

---

## Part 10: Building on These Concepts

### Step 10.1: What You've Learned

Congratulations! You now know how to:

✅ Install and configure Jest for LWC OSS projects  
✅ Write basic component tests  
✅ Use TDD to drive development with tests  
✅ Use BDD to describe behaviors clearly  
✅ Test async operations  
✅ Run tests efficiently with watch mode  
✅ Check test coverage  
✅ Use common Jest matchers  
✅ Follow testing best practices  

### Step 10.2: Next Steps - Advanced Topics

As you become more comfortable with testing, explore these advanced topics:

1. Testing Public Properties (@api)

```javascript
it('updates display when public property changes', async () => {
    const element = createElement('c-display', { is: Display });
    document.body.appendChild(element);

    element.message = 'Hello';
    await Promise.resolve();

    const display = element.shadowRoot.querySelector('.message');
    expect(display.textContent).toBe('Hello');
});
```

1. Testing Custom Events

```javascript
it('fires custom event when button is clicked', () => {
    const element = createElement('c-button', { is: Button });
    document.body.appendChild(element);

    // Listen for the custom event
    const handler = jest.fn();
    element.addEventListener('customclick', handler);

    const button = element.shadowRoot.querySelector('button');
    button.click();

    expect(handler).toHaveBeenCalled();
});
```

1. Testing Wire Adapters**

For components that use `@wire`, you'll need additional mocking utilities. This is covered in the [LWC Testing Documentation](https://lwc.dev/guide/test).

1. Testing with External Libraries

When your components use third-party libraries, you may need to mock them. Jest provides `jest.mock()` for this purpose.

1. Integration Testing

Test multiple components working together:

```javascript
it('parent and child components communicate correctly', async () => {
    const parent = createElement('c-parent', { is: Parent });
    document.body.appendChild(parent);

    const child = parent.shadowRoot.querySelector('c-child');
    const button = child.shadowRoot.querySelector('button');
    button.click();

    await Promise.resolve();

    const parentDisplay = parent.shadowRoot.querySelector('.display');
    expect(parentDisplay.textContent).toBe('Updated from child');
});
```

### Step 10.3: Recommended Practice Path

1. **Week 1-2:** Add tests to 2-3 existing simple components
   - Get comfortable with the syntax
   - Practice using different matchers
   - Run tests in watch mode while developing

2. **Week 3-4:** Use TDD for a new feature
   - Write test first, then implementation
   - Experience the Red-Green-Refactor cycle
   - Notice how tests guide your design

3. **Week 5-6:** Use BDD for a complex component
   - Plan behaviors with nested describe blocks
   - Use Given-When-Then comments
   - See how tests become documentation

4. **Ongoing:** Build the habit
   - Write tests for every new component
   - Add tests when fixing bugs (regression tests)
   - Aim for high coverage on critical components

### Step 10.4: When Tests Fail

When a test fails, follow this debugging process:

1. **Read the error message carefully**

   ```bash
   expect(received).toBe(expected)
   
   Expected: "Hello"
   Received: "Helo"
   ```

2. **Check the test is correct**
   - Is your expectation actually what should happen?
   - Are you querying for the right element?

3. **Check the component code**
   - Did you implement the feature correctly?
   - Are there typos or logic errors?

4. **Add temporary debugging**

   ```javascript
   console.log('Element:', element);
   console.log('Query result:', element.shadowRoot.querySelector('.message'));
   ```

5. **Run just that test**

   ```bash
   npm run test:unit -- -t "displays greeting message"
   ```

### Step 10.5: Common Pitfalls to Avoid

❌ **Not waiting for async updates**

```javascript
// BAD
button.click();
expect(result.textContent).toBe('Done'); // Fails!

// GOOD
button.click();
await Promise.resolve();
expect(result.textContent).toBe('Done'); // Passes!
```

❌ **Forgetting afterEach cleanup**

```javascript
// BAD
describe('c-my-component', () => {
    it('test 1', () => { /* ... */ });
    it('test 2', () => { /* ... */ }); // May fail due to test 1
});

// GOOD
describe('c-my-component', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });
    it('test 1', () => { /* ... */ });
    it('test 2', () => { /* ... */ }); // Clean slate!
});
```

❌ **Testing implementation instead of behavior**

```javascript
// BAD - Tests internal method name
expect(element.handleClick).toBeDefined();

// GOOD - Tests what the user sees
button.click();
expect(message.textContent).toBe('Clicked!');
```

❌ **Vague test names**

```javascript
// BAD
it('works', () => { /* ... */ });

// GOOD
it('displays error when email is invalid', () => { /* ... */ });
```

---

## Summary

You've now learned how to set up and use Jest for testing Lightning Web Components following the official lwc.dev guidelines. You understand:

- **Installation**: How to install Jest and all required LWC dependencies
- **Configuration**: How to configure Jest with the LWC preset and module mappings
- **Basic Testing**: How to write and run component tests
- **TDD**: How to use Test-Driven Development to guide your coding
- **BDD**: How to use Behavior-Driven Development to describe behaviors clearly
- **Best Practices**: How to write maintainable, effective tests

### Key Takeaways

**Testing makes you faster, not slower:**

- Catch bugs immediately instead of in production
- Refactor with confidence
- Document how components should work

**Start small, build the habit:**

- Begin with simple components
- Use watch mode for instant feedback
- Gradually increase test sophistication

**Tests are documentation:**

- Good test names explain what the component does
- Future developers (including you) will thank you
- Tests show how to use your components

### Helpful Resources

- **[LWC Testing Documentation](https://lwc.dev/guide/test)** - Official documentation
- **[LWC Recipes](https://lwc.dev/guide/recipes)** - Practical examples of LWC components
- **[Jest Documentation](https://jestjs.io/)** - Complete Jest API reference
- **[Jest Matchers](https://jestjs.io/docs/expect)** - All the different ways to assert (`.toBe()`, `.toContain()`, etc.)
- **[Jest Expect API](https://jestjs.io/docs/expect)** - All assertion methods
- **[Mocking in Jest](https://jestjs.io/docs/mock-functions)** - How to create mocks and spies
- **[@lwc/jest-preset on npm](https://www.npmjs.com/package/@lwc/jest-preset)** - Package documentation
- **[Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)** - **[General testing wisdom (applicable to LWC)](https://testingjavascript.com/)**

- **[Testing Library Queries](https://testing-library.com/docs/queries/about)** - Better ways to find elements
- **[Async Testing in Jest](https://jestjs.io/docs/asynchronous)** - Deep dive into async tests
- **[Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)** - Learn more about TDD principles
- **[Behavior-Driven Development](https://cucumber.io/docs/bdd/)** - Learn more about BDD practices
- **[Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html)** - Understand this testing pattern

Now go forth and test! 🚀 Your future self will thank you for the confidence that comes with a well-tested codebase.

---
