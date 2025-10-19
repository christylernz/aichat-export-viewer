# Setting Up Salesforce Lightning Design System 2 (SLDS 2) in LWR Project

## Overview

This guide provides step-by-step instructions for integrating SLDS 2 into your LWR (Lightning Web Runtime) application. Unlike LWC OSS where you might use `lwc-services.config.js`, LWR requires a different approach using asset configuration and build scripts.

## Prerequisites

- Node.js installed (v22 or higher recommended)
- LWR project initialized
- npm package manager

## Step 1: Install Required Packages

Install SLDS and synthetic shadow packages for your project:
The Salesforce Lightning Design System (SLDS) provides a set of design guidelines and CSS frameworks for building applications on the Salesforce platform. It's needed to ensure your application adheres to Salesforce's design standards.
The synthetic shadow package is required to enable SLDS styles to penetrate Lightning Web Components (LWC) when using Shadow DOM. The shadow DOM encapsulates styles, which can prevent global styles like SLDS from applying correctly. The synthetic shadow polyfill simulates Shadow DOM behavior while allowing external styles to affect component styling. This is required when you want SLDS styles to work within LWC components because SLDS relies on global CSS rules that need to apply across component boundaries.

```bash
# Install SLDS with --save-dev to include it in devDependencies which is typical for design systems
npm install @salesforce-ux/design-system --save-dev

# Install synthetic shadow for SLDS styling to work in LWC components 
npm install @lwc/synthetic-shadow --save-dev
```

After installing the design system and synthetic shadow for SLDS, you want to check that `package.json` includes:

```json
{
  "devDependencies": {
    "@salesforce-ux/design-system": "^2.x.x", // SLDS version 2
    "@lwc/synthetic-shadow": "^8.x.x", // synthetic shadow for LWC currently used for SLDS styles
  }
}
```

This shows that the necessary packages will be installed for development, ensuring SLDS styles can be applied correctly within your LWC components. 

### Does this also get used for production builds?

Yes, because the styles need to be available in both environments for consistent UI rendering. 

### How does this happen?

The styles are copied to the assets directory and referenced in your layout templates, making them accessible in both development and production builds. 

### Where does this happen?

This is handled in the asset configuration in `lwr.config.json` and the copy resources script. You can find more information here: [LWR Asset Management](https://developer.salesforce.com/docs/platform/lwr/guide/lwr-compile-data.html).

## Step 2: Create Copy Resources Script

Create a script to copy SLDS resources into your project's assets directory. This replaces the build-time copying that `lwc-services.config.js` would handle in LWC OSS.

To run this script you will need to install the cpx package:

```bash
npm install cpx --save-dev
```

### Copy assets using Node.js Script

Create a file called `scripts/copy-resources.mjs`:

Add the following to the content of the file: 

```javascript
import cpx from 'cpx';
import { log } from 'console';

// Copy the SLDS resources to the assets dir
cpx.copy('node_modules/@salesforce-ux/design-system/assets/**/*', 'src/assets', () => {
  log(`Done copying SLDS resources`);
});
```

This script uses the `cpx` package to copy all SLDS assets (CSS, fonts, icons) from the `node_modules` directory to your project's `src/assets` directory.

### How to run the script from npm

You can add a script entry in your `package.json` to run this copy script easily:

```json
{
  "scripts": {
    "copy:slds": "node scripts/copy-assets.mjs"
  }
}
```

Then, you can run the script using npm:

```bash
npm run copy:slds
```

### Adding it to your development and production build process

You can add the copy command as a pre-script to your `dev` and `build` commands in `package.json`:

```json
{
  "scripts": {
    "copy:slds": "node scripts/copy-resources.mjs",
    "predev": "npm run copy:slds",
    "prebuild": "npm run copy:slds",
    "dev": "lwr dev",
    "build": "lwr build"
  }
}
```

### Why do we copy to `src/assets`?

- LWR serves static assets from the `src/assets` directory, making them accessible via URL paths defined in `lwr.config.json`.
- This allows you to reference SLDS styles and resources in your layout templates and components.
- Keeping assets in `src/assets` ensures they are included in both development and production builds.





## Step 3: Configure LWR Assets

Update your `lwr.config.json` to properly handle SLDS resources and enable synthetic shadow:
An explanation of each part is included in comments in the code block below.

```json
{
  "lwc": {
    // Define where your LWC modules are located
    "modules": [
      { "dir": "$rootDir/src/modules" },
    ]
  },
  // Define directories for layouts and templates
  "bundleConfig": {
    // exclude synthetic-shadow from being bundled separately
    "exclude": ["lwc", "@lwc/synthetic-shadow"]  // Don't exclude synthetic-shadow
  },
  // Asset configuration for SLDS resources
  "assets": [
    {
      // Define an alias for easier reference in templates
      "alias": "assetsDir",
      "dir": "$rootDir/src/assets",
      "urlPath": "/assets"
    },
    // Font files for SLDS
    {
      "dir": "$rootDir/src/assets/fonts",
      "urlPath": "/fonts"
    },
    // Reference specific SVG icon sprite files that are used
    {
      "file": "$rootDir/src/assets/icons/utility-sprite/svg/symbols.svg",
      "urlPath": "/assets/icons/utility-sprite/svg/symbols.svg"
    },
    {
      "file": "$rootDir/src/assets/icons/standard-sprite/svg/symbols.svg",
      "urlPath": "/assets/icons/standard-sprite/svg/symbols.svg"
    },
    {
      "file": "$rootDir/src/assets/icons/custom-sprite/svg/symbols.svg",
      "urlPath": "/assets/icons/custom-sprite/svg/symbols.svg"
    }
  ],
  // Define application routes
  "routes": [
    {
      "id": "app",
      "path": "/",
      "rootComponent": "example/app",
      "layoutTemplate": "$layoutsDir/main.html",
      "bootstrap": {
        "syntheticShadow": true  // REQUIRED for SLDS styles in LWC components
      }
    }
  ]
}
```

### Important Notes on Asset Configuration

- The `alias` property creates a variable that can be referenced in templates
- The `urlPath` defines the URL path where assets will be served
- Icon sprite files need individual entries for proper SVG icon support
- The `syntheticShadow` setting affects how SLDS styles work with LWC (see detailed section below)

## Step 4: Link SLDS Stylesheets in Layout

Update your layout template at `src/layouts/main.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ page.title }}</title>
    
    <!-- SLDS Styles -->
    <link rel="stylesheet" href="$assetsDir/styles/salesforce-lightning-design-system.min.css" />
    
    <!-- Optional: Custom overrides -->
    <link rel="stylesheet" href="/assets/styles/custom.css" />
</head>
<body>
    <!-- CRITICAL: LWR body content injection point -->
    <!-- This is where your LWC components will be rendered -->
    {{{ body }}}
    
    <!-- CRITICAL: LWR resources - MUST be included for LWC components to work -->
    <!-- This includes the LWC framework, synthetic shadow, and component code -->
    {{{ lwr_resources }}}
</body>
</html>
```

### ⚠️ Critical Requirements for LWC Components to Load

**BOTH `{{{ body }}}` and `{{{ lwr_resources }}}` MUST be present in your layout template for LWC components to render!**

- `{{{ body }}}` - Where the actual component HTML will be injected
- `{{{ lwr_resources }}}` - Contains all JavaScript needed for LWC components to function

Without `lwr_resources`, your page will have SLDS styling but NO LWC components will load or display!

## Step 5: Project Structure

After setup, your project structure should look like:

```shell
my-lwr-app/
├── node_modules/
│   └── @salesforce-ux/
├── scripts/
│   └── copy-resources.mjs
├── src/
│   ├── assets/
│   │   ├── styles/
│   │   │   └── salesforce-lightning-design-system.min.css
│   │   ├── fonts/
│   │   └── icons/
│   ├── layouts/
│   │   └── main.html
│   └── modules/
│       └── example/
│           └── app/
├── lwr.config.json
└── package.json
```

## Step 6: Using SLDS in Components

Now you can use SLDS classes in your Lightning Web Components:

```javascript
// example/app/app.js
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    // Component logic
}
```

```html
<!-- example/app/app.html -->
<template>
    <div class="slds-card">
        <div class="slds-card__header">
            <h2 class="slds-text-heading_small">Welcome to LWR with SLDS</h2>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <p>Your content here</p>
            <button class="slds-button slds-button_brand">Click Me</button>
        </div>
    </div>
</template>
```

## Understanding Synthetic Shadow DOM

### What is Synthetic Shadow DOM?

Synthetic Shadow DOM is a polyfill that simulates Shadow DOM behavior while allowing external styles (like SLDS) to penetrate component boundaries. This is crucial for SLDS because it's a global CSS framework that needs to style components.

### Do You Need Synthetic Shadow?

#### Check if you need it

**You NEED Synthetic Shadow if:**

- ✅ You're using SLDS classes inside LWC component templates
- ✅ You want SLDS styles to apply to child components
- ✅ You're migrating from Salesforce Platform where synthetic shadow is standard
- ✅ You're using base Lightning components that expect SLDS styling

**You DON'T need Synthetic Shadow if:**

- ❌ You're only using SLDS in regular HTML/Nunjucks templates (not inside LWC)
- ❌ You're using custom CSS or CSS-in-JS solutions
- ❌ You want true style encapsulation between components
- ❌ You're building components with their own complete styling

### How to Test if Synthetic Shadow is Required

Create a test component to verify:

```javascript
// test/sldsTest/sldsTest.js
import { LightningElement } from 'lwc';

export default class SldsTest extends LightningElement {}
```

```html
<!-- test/sldsTest/sldsTest.html -->
<template>
    <div class="test-container">
        <!-- Test 1: SLDS button styling -->
        <button class="slds-button slds-button_brand">
            SLDS Button (Should be blue if working)
        </button>
        
        <!-- Test 2: SLDS utility classes -->
        <div class="slds-m-top_medium slds-p-around_medium slds-box">
            This box should have margin, padding, and border
        </div>
        
        <!-- Test 3: Native styles (should always work) -->
        <div style="color: green; font-weight: bold;">
            This text is always green (inline styles)
        </div>
    </div>
</template>
```

**Run the test:**

1. First, try WITHOUT synthetic shadow:

   ```json
   {
     "routes": [{
       "id": "test",
       "path": "/test",
       "rootComponent": "test/sldsTest",
       "layoutTemplate": "$layoutsDir/main.html"
       // No bootstrap.syntheticShadow setting
     }]
   }
   ```

2. Check the component at `/test`:
   - If SLDS styles are NOT applied → You need synthetic shadow
   - If SLDS styles ARE applied → You might be in a different rendering mode

3. Enable synthetic shadow:

   ```json
   {
     "routes": [{
       "id": "test",
       "path": "/test",
       "rootComponent": "test/sldsTest",
       "layoutTemplate": "$layoutsDir/main.html",
       "bootstrap": {
         "syntheticShadow": true
       }
     }]
   }
   ```

### Configuring Synthetic Shadow

#### Option 1: Global Configuration (All Routes)

Set it globally in `lwr.config.json`:

```json
{
  "bootstrap": {
    "syntheticShadow": true
  },
  "routes": [
    // All routes will inherit this setting
  ]
}
```

#### Option 2: Per-Route Configuration

Configure for specific routes only:

```json
{
  "routes": [
    {
      "id": "app-with-slds",
      "path": "/app",
      "rootComponent": "example/app",
      "layoutTemplate": "$layoutsDir/main.html",
      "bootstrap": {
        "syntheticShadow": true  // Only this route uses synthetic shadow
      }
    },
    {
      "id": "modern-app",
      "path": "/modern",
      "rootComponent": "modern/app",
      "layoutTemplate": "$layoutsDir/main.html"
      // No synthetic shadow - uses native shadow DOM
    }
  ]
}
```

#### Option 3: Component-Level Light DOM

For specific components that need to render in light DOM:

```javascript
// example/lightComponent/lightComponent.js
import { LightningElement } from 'lwc';

export default class LightComponent extends LightningElement {
    static renderMode = 'light'; // Renders in light DOM
}
```

### Performance Considerations

**Synthetic Shadow Enabled:**

- ➕ SLDS styles work everywhere
- ➕ Compatible with Salesforce Platform components
- ➖ Slightly larger bundle size (includes polyfill)
- ➖ Minor performance overhead for style calculation

**Native Shadow DOM:**

- ➕ Better performance
- ➕ True style encapsulation
- ➕ Smaller bundle size
- ➖ SLDS won't penetrate component boundaries
- ➖ Requires component-specific styling solutions

### Debugging Synthetic Shadow Issues

Check if synthetic shadow is active:

```javascript
// In browser console
console.log('Synthetic Shadow Active:', 
    typeof window.ShadowRoot !== 'undefined' && 
    window.ShadowRoot.prototype.constructor.name === 'SyntheticShadowRoot'
);

// In your component
import { LightningElement } from 'lwc';

export default class DebugComponent extends LightningElement {
    connectedCallback() {
        console.log('Shadow Root Type:', this.template.constructor.name);
        // Will show "SyntheticShadowRoot" or "ShadowRoot"
    }
}
```

## Step 7: Build and Run

### Development Mode

For development, use the `dev` command which typically includes hot-reloading:

```bash
# Copy SLDS resources first
npm run copy-slds

# Start development server with hot-reload
npm run dev
```

### Production Build

For production builds:

```bash
# Copy SLDS resources
npm run copy-slds

# Create production build
npm run build

# Start production server
npm start
```

### Automated Workflow

Add pre-scripts to automate resource copying:

```json
{
  "scripts": {
    "copy-slds": "node scripts/copy-resources.mjs",
    "predev": "npm run copy-slds",
    "prebuild": "npm run copy-slds",
    "dev": "lwr dev",
    "build": "lwr build",
    "start": "lwr start"
  }
}
```

Now you can simply run:

```bash
npm run dev    # Automatically copies SLDS then starts dev server
npm run build  # Automatically copies SLDS then builds
```

## Troubleshooting

### Issue: LWC components not loading/displaying

- **Check 1**: Ensure `{{{ lwr_resources }}}` is included in your layout template
- **Check 2**: Verify `{{{ body }}}` is present in the layout template  
- **Check 3**: Install `@lwc/synthetic-shadow` package: `npm install @lwc/synthetic-shadow --save-dev`
- **Check 4**: Enable synthetic shadow in route configuration
- **Solution**: Both body and lwr_resources MUST be in your layout template for LWC to work

### Issue: SLDS styles work in main.html but not in LWC components

- **Cause**: Native Shadow DOM is blocking global styles
- **Solution**: Enable `syntheticShadow: true` in your route configuration
- **Verify**: Check that `@lwc/synthetic-shadow` is installed in package.json

### Issue: Page loads with SLDS styling but components are missing

- **Cause**: Missing `lwr_resources` in layout template
- **Check**: View page source - if you see component tags but no content, lwr_resources is missing
- **Solution**: Add `{{{ lwr_resources }}}` to your layout template just before `</body>`

### Issue: Icons not displaying

- **Solution**: Ensure icon sprite files are properly mapped in `lwr.config.json`
- Use the correct syntax for SLDS icons:
  
  ```html
  <svg class="slds-icon" aria-hidden="true">
    <use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#add"></use>
  </svg>
  ```

### Issue: Fonts not loading

- **Solution**: Verify the fonts directory is properly copied and the URL path in `lwr.config.json` matches the font references in the CSS

## Best Practices

1. **Version Control**: Add `src/assets/` to `.gitignore` if you're copying SLDS resources as part of the build process
2. **Build Pipeline**: Integrate the copy-resources script into your CI/CD pipeline
3. **Custom Tokens**: Consider using SLDS design tokens for consistent theming
4. **Performance**: Use the minified version of SLDS CSS in production
5. **Updates**: When updating SLDS version, clear the assets folder and recopy resources

## Migration from LWC OSS

If migrating from LWC OSS with `lwc-services`:

| LWC OSS | LWR |
|---------|-----|
| `lwc-services.config.js` copy config | `scripts/copy-resources.mjs` or npm scripts |
| `index.html` with direct link | `src/layouts/main.html` with template variables |
| `resources` in config | `assets` in `lwr.config.json` |
| Build-time copying via webpack | Pre-build script execution |

## Additional Resources

- [SLDS Official Documentation](https://www.lightningdesignsystem.com/)
- [LWR Documentation](https://developer.salesforce.com/docs/platform/lwr/guide)
- [LWR Asset Management](https://developer.salesforce.com/docs/platform/lwr/guide/lwr-compile-data.html)

## Summary

The key differences when setting up SLDS in LWR compared to LWC OSS are:

1. Use `lwr.config.json` asset configuration instead of `lwc-services.config.js`
2. Copy SLDS resources to `src/assets/` using scripts
3. Reference stylesheets in layout templates using LWR template variables
4. Configure proper URL paths for all SLDS resources including icons and fonts

This approach gives you the same SLDS capabilities in LWR while working within its asset management system.