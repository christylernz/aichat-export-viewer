# Setting Up Jest Testing for Your LWC OSS Project

## Introduction

This guide will walk you through setting up Jest testing in your existing LWC OSS project from scratch. We'll build our testing knowledge incrementally, starting with the basics and gradually adding more sophisticated testing patterns.

**What is Jest?** Jest is a JavaScript testing framework created by Facebook. It's designed to work with minimal configuration and provides everything you need to write tests: a test runner, assertion library, and mocking capabilities all in one package.

**Why Jest for LWC?** Salesforce provides official Jest support for Lightning Web Components through the `@lwc/jest-preset` package, making it the recommended testing framework for LWC projects.

---

## Prerequisites

✅ Node.js and npm are installed and working  
✅ You have an LWC OSS/LWR project set up  
✅ You can run your project and see a component display  

---

## Part 1: Installing Jest (The Test Runner)

### Step 1.1: Install Jest

Open your terminal in your project's root directory and run:

```bash
npm install --save-dev jest
```

**What does this do?**

- `npm install` - Downloads and installs a package
- `--save-dev` - Saves this as a "development dependency" (only needed for development, not production)
- `jest` - The package name we're installing

**Verify Installation:**
After installation completes, check your `package.json` file. You should see jest listed under `devDependencies`:

```json
{
  "devDependencies": {
    "jest": "^29.x.x"
  }
}
```

### Step 1.2: Create Your First Test Script

Add a test script to your `package.json`. Find the `"scripts"` section and add:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

**Why?** This creates a shortcut so you can run `npm test` instead of typing `npx jest` every time.

### Step 1.3: Write a Simple Test (Not LWC Yet)

Let's verify Jest works with a basic JavaScript test first.

Create a new folder in your project root called `__tests__`:

```bash
mkdir __tests__
```

**Why `__tests__`?** Jest automatically looks for test files in folders named `__tests__` or files ending in `.test.js` or `.spec.js`.

Create a file called `__tests__/basic.test.js`:

```javascript
// A simple function to test
function add(a, b) {
    return a + b;
}

// Your first test!
test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
});
```

**Understanding the test:**
- `test('description', () => {...})` - Defines a test case with a description
- `expect(value)` - Says "I expect this value..."
- `.toBe(3)` - "...to be equal to 3"

### Step 1.4: Run Your First Test

```bash
npm test
```

You should see output like:

```
PASS  __tests__/basic.test.js
  ✓ adds 1 + 2 to equal 3 (2 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

🎉 **Success!** Jest is now working in your project.

**Further Reading:**
- [Jest Getting Started](https://jestjs.io/docs/getting-started)
- [Jest Expect API](https://jestjs.io/docs/expect) - All the assertion methods

---

## Part 2: Installing LWC Testing Support

Now that Jest works, we need to teach it how to understand Lightning Web Components.

### Step 2.1: Install the LWC Jest Preset

```bash
npm install --save-dev @lwc/jest-preset
```

**What is this?** The `@lwc/jest-preset` package provides:
- Jest configuration specifically for LWC
- The ability to import and test LWC components
- DOM utilities for testing component behavior

**Verify Installation:**
Check `package.json` - you should now see:

```json
{
  "devDependencies": {
    "jest": "^29.x.x",
    "@lwc/jest-preset": "^17.x.x"
  }
}
```

### Step 2.2: Create Jest Configuration

Now we need to tell Jest to use the LWC preset. Create a file called `jest.config.js` in your project root:

```javascript
const { jestConfig } = require('@lwc/jest-preset');

module.exports = {
    ...jestConfig
};
```

**Understanding this code:**
- We import the default Jest configuration for LWC
- `...jestConfig` spreads (copies) all the configuration settings
- This gives us all the LWC-specific Jest settings without writing them ourselves

### Step 2.3: Configure Module Paths

Jest needs to know where your LWC components are located. Update your `jest.config.js`:

```javascript
const { jestConfig } = require('@lwc/jest-preset');

module.exports = {
    ...jestConfig,
    moduleNameMapper: {
        // Tell Jest where to find your components
        // Adjust the path if your components are in a different location
        '^c/(.+)$': '<rootDir>/src/modules/c/$1/$1'
    }
};
```

**Understanding moduleNameMapper:**
- The left side (`'^c/(.+)$'`) is a pattern matching component imports like `import MyComponent from 'c/myComponent'`
- The right side tells Jest where to actually find those files
- `<rootDir>` is Jest's placeholder for your project root
- The `$1/$1` means if you import `c/myComponent`, it looks in `src/modules/c/myComponent/myComponent.js`

**Important:** Adjust the path (`src/modules/c/`) to match where YOUR components actually live in your project. Common alternatives:
- `<rootDir>/force-app/main/default/lwc/$1/$1` (Salesforce DX projects)
- `<rootDir>/src/client/modules/c/$1/$1` (LWR projects)

### Step 2.4: Create a Simple Component to Test

Let's create a very simple component. In your components directory, create a new folder called `greeting`:

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

### Step 2.5: Write Your First LWC Test

Create a `__tests__` folder inside the `greeting` component folder and add a test file:

**File: `src/modules/c/greeting/__tests__/greeting.test.js`**

```javascript
// Import the function to create components in tests
import { createElement } from 'lwc';
// Import the component we want to test
import Greeting from 'c/greeting';

// Group related tests together
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

**Understanding the new concepts:**

1. **`createElement('c-greeting', { is: Greeting })`**  
   Creates an instance of your component for testing. The first parameter is the tag name, the second specifies which component class to use.

2. **`document.body.appendChild(element)`**  
   Adds the component to a test DOM so we can interact with it.

3. **`element.shadowRoot.querySelector()`**  
   LWC components use Shadow DOM. We need `shadowRoot` to access elements inside the component.

4. **`describe('c-greeting', () => {...})`**  
   Groups related tests together. This is optional but helps organize tests.

### Step 2.6: Run Your LWC Test

```bash
npm test
```

You should see:

```
PASS  src/modules/c/greeting/__tests__/greeting.test.js
  c-greeting
    ✓ displays the greeting message (15 ms)
```

🎉 **Success!** You can now test LWC components!

**Troubleshooting:**
- If you get "Cannot find module 'c/greeting'", check your `moduleNameMapper` path in `jest.config.js`
- If tests pass but you see warnings about `@salesforce` modules, don't worry - we'll fix that next

**Further Reading:**
- [LWC Testing Documentation](https://lwc.dev/guide/test)
- [Jest describe() and it()](https://jestjs.io/docs/api#describename-fn)

---

## Part 3: Cleaning Up After Tests

### Step 3.1: Understanding the Problem

Run your tests again with:

```bash
npm test
```

Each test runs fine individually, but if we add multiple tests, leftover DOM elements from previous tests can interfere with new tests. Let's see this problem:

Update `greeting.test.js` to have two tests:

```javascript
import { createElement } from 'lwc';
import Greeting from 'c/greeting';

describe('c-greeting', () => {
    it('displays the greeting message', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        const div = element.shadowRoot.querySelector('.greeting');
        expect(div.textContent).toBe('Hello, World!');
    });

    it('has only one greeting element', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        // This could find elements from the previous test!
        const allGreetings = document.body.querySelectorAll('c-greeting');
        expect(allGreetings.length).toBe(1);
    });
});
```

Run the tests - the second test fails! It finds 2 greeting elements because we didn't clean up after the first test.

### Step 3.2: Add Cleanup

Add an `afterEach` hook to clean up:

```javascript
import { createElement } from 'lwc';
import Greeting from 'c/greeting';

describe('c-greeting', () => {
    // This runs after EACH test
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

    it('has only one greeting element', () => {
        const element = createElement('c-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        const allGreetings = document.body.querySelectorAll('c-greeting');
        expect(allGreetings.length).toBe(1);
    });
});
```

**Understanding afterEach:**
- Runs automatically after each `it()` test
- Ensures a clean slate for the next test
- Prevents test pollution (tests affecting each other)

### Step 3.3: Verify Cleanup Works

```bash
npm test
```

Both tests should now pass! ✅

**Best Practice:** Always include `afterEach` cleanup in your component tests.

**Further Reading:**
- [Jest Setup and Teardown](https://jestjs.io/docs/setup-teardown)

---

## Part 4: Test-Driven Development (TDD) - Building a Counter

Now let's practice **Test-Driven Development** by building a counter component. In TDD, we write tests BEFORE writing the code.

**The TDD Cycle:**
1. **Red** - Write a failing test
2. **Green** - Write minimal code to pass the test
3. **Refactor** - Improve the code while keeping tests green

### Step 4.1: Write the First Failing Test (RED)

Let's start by imagining what we want: a counter that starts at 0.

Create `src/modules/c/counter/counter.js` (just an empty file for now):

```javascript
import { LightningElement } from 'lwc';

export default class Counter extends LightningElement {
    // Empty for now - we'll add code after the test fails
}
```

Create `src/modules/c/counter/__tests__/counter.test.js`:

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

Run the test:

```bash
npm test counter
```

**It fails!** ❌ That's expected - we haven't created the template yet. The test is "driving" us to write the code.

### Step 4.2: Write Minimal Code to Pass (GREEN)

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
npm test counter
```

**It passes!** ✅ We've completed one TDD cycle.

### Step 4.3: Add Increment Feature (RED → GREEN)

Now let's add a button to increment the counter. Test first:

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
npm test counter
```

Both tests pass! ✅

### Step 4.4: Add Decrement Feature (Continue TDD)

Let's add one more feature. Add this test:

```javascript
it('decrements count when decrement button is clicked', () => {
    // ARRANGE
    const element = createElement('c-counter', {
        is: Counter
    });
    document.body.appendChild(element);

    // Start with count at 5 so we can decrement
    element.shadowRoot.querySelector('.increment-btn').click();
    element.shadowRoot.querySelector('.increment-btn').click();
    element.shadowRoot.querySelector('.increment-btn').click();
    element.shadowRoot.querySelector('.increment-btn').click();
    element.shadowRoot.querySelector('.increment-btn').click();

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

## Part 5: Behavior-Driven Development (BDD) - Building a Todo List

**BDD** focuses on describing the *behavior* of your application in human-readable terms. It uses:
- `describe()` blocks to group behaviors
- Clear, descriptive test names
- Given-When-Then structure

### Step 5.1: Plan the Behaviors

Before writing any code, let's describe what our todo list should do:

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

        it('should show a message "No todos yet"', () => {
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

**Notice:** We're planning our tests to read like specifications. This is BDD - our tests describe *behaviors* not just technical implementation.

### Step 5.2: Implement the First Behavior

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

**Notice the Given-When-Then comments.** This is a BDD pattern that makes tests read like scenarios.

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
npm test todoList
```

It passes! ✅

### Step 5.3: Add Empty State Message

Implement the second test:

```javascript
it('should show a message "No todos yet"', () => {
    // GIVEN: A new todo list component
    const element = createElement('c-todo-list', {
        is: TodoList
    });
    document.body.appendChild(element);

    // WHEN: The list is empty
    // (it starts empty)

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

### Step 5.4: Add Todo Creation (Async Testing)

Now the interesting part - adding todos. This requires handling user input:

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

**New concept: `async/await`**  
- LWC components re-render asynchronously
- `await Promise.resolve()` waits for the next "tick" - letting the component update
- The test function must be `async` to use `await`

**New concept: Simulating user input**  
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
npm test todoList
```

All tests pass! ✅

### Step 5.5: Verify Input Clears

Add one more test to verify the input clears:

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
- Tests act as living documentation

**Further Reading:**
- [Behavior-Driven Development](https://cucumber.io/docs/bdd/)
- [Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html)

---

## Part 6: Running Tests Efficiently

### Step 6.1: Watch Mode for Active Development

When actively developing, you don't want to manually run tests every time. Jest has a "watch mode":

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

Run it:

```bash
npm run test:watch
```

**What happens:**
- Jest starts in interactive mode
- Tests automatically re-run when you save files
- You can press keys to filter which tests run
- Press `q` to quit

**Why this is useful for TDD:**
- Immediate feedback when you save code
- See tests turn from red ❌ to green ✅ instantly
- Speeds up the TDD cycle dramatically

### Step 6.2: Run Specific Tests

You can run tests for just one component:

```bash
npm test counter
```

Or just one test file:

```bash
npm test counter.test.js
```

Or tests matching a pattern:

```bash
npm test todo
```

### Step 6.3: Check Test Coverage

Coverage shows which parts of your code are tested. Add this script:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Run it:

```bash
npm run test:coverage
```

You'll see a report showing:
- **% Statements** - How many lines of code were executed
- **% Branches** - How many if/else paths were tested
- **% Functions** - How many functions were called
- **% Lines** - Similar to statements

A coverage report is also generated in `coverage/lcov-report/index.html` - open this in a browser to see a visual breakdown.

**When to check coverage:**
- After implementing a feature
- Before submitting code for review
- To identify untested code paths

**Note:** 100% coverage doesn't mean perfect tests, but low coverage definitely indicates missing tests.

---

## Part 7: Best Practices Summary

### Test Organization

✅ **DO:**
- Put tests in `__tests__` folders next to components
- Name test files `componentName.test.js`
- Use `describe()` to group related tests
- Use descriptive test names that explain behavior
- Include `afterEach` cleanup in every test suite

❌ **DON'T:**
- Put all tests in one giant file
- Name tests vaguely like "test 1", "test 2"
- Let tests depend on each other's state

### TDD Workflow

1. **Red** - Write a failing test first
2. **Green** - Write minimal code to pass
3. **Refactor** - Improve code while tests stay green
4. Repeat

**Use TDD when:**
- Building new features from scratch
- You want tests to guide your design
- You want confidence in your refactoring

### BDD Approach

- Use `describe()` blocks to group behaviors
- Write test names as full sentences: "should display error message when input is invalid"
- Use Given-When-Then comments in complex tests
- Think from the user's perspective

**Use BDD when:**
- You want tests to serve as documentation
- Communicating with non-technical stakeholders
- Testing user-facing behaviors

### Async Testing

Always use `async/await` when:
- Testing user interactions (clicks, input)
- Components update based on state changes
- Testing wire adapters (coming in advanced topics)

```javascript
it('should update after user action', async () => {
    // Arrange
    const element = createElement('c-my-component', { is: MyComponent });
    document.body.appendChild(element);

    // Act
    const button = element.shadowRoot.querySelector('button');
    button.click();
    
    // WAIT for component to re-render
    await Promise.resolve();

    // Assert
    const result = element.shadowRoot.querySelector('.result');
    expect(result.textContent).toBe('Updated!');
});
```

---

## Part 8: What's Next?

You now have a solid foundation in Jest testing for LWC! Here are topics to explore next:

### Advanced Testing Topics

1. **Mocking Wire Adapters** - Test components that use `@wire`
2. **Testing Events** - Verify custom events are fired correctly
3. **Testing Slots** - Test components that use `<slot>` elements
4. **Integration Tests** - Test multiple components working together
5. **Snapshot Testing** - Catch unexpected UI changes
6. **Testing Third-Party Libraries** - Mock external dependencies

### Recommended Learning Path

1. Practice TDD with small components
2. Add tests to existing components (get comfortable with the syntax)
3. Learn to mock wire adapters when you need to test data-driven components
4. Explore Jest's full API for more assertion types
5. Set up CI/CD to run tests automatically

### Helpful Resources

- **[LWC Testing Documentation](https://lwc.dev/guide/test)** - Official guide
- **[Jest Documentation](https://jestjs.io/)** - Complete Jest API reference
- **[Jest Matchers](https://jestjs.io/docs/expect)** - All the different ways to assert (`.toBe()`, `.toContain()`, etc.)
- **[Testing Library Queries](https://testing-library.com/docs/queries/about)** - Better ways to find elements
- **[Mocking in Jest](https://jestjs.io/docs/mock-functions)** - How to create mocks and spies
- **[Async Testing in Jest](https://jestjs.io/docs/asynchronous)** - Deep dive into async tests
- **[Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)** - Learn more about TDD principles
- **[Behavior-Driven Development](https://cucumber.io/docs/bdd/)** - Learn more about BDD practices
- **[Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html)** - Understand this testing pattern
- **[LWC Recipes](https://lwc.dev/guide/recipes)** - Practical examples of LWC components
---