# Tailwind CSS Migration Guide

This project has been migrated from custom CSS to Tailwind CSS. Here's what has been done and how to continue the migration.

## ✅ Completed

1. **Tailwind Configuration** (`tailwind.config.js`)
   - Custom color palette (primary, secondary, accent, success, warning, danger)
   - Custom gradients
   - Custom shadows
   - Extended theme with brand colors

2. **Base Styles** (`index.css`)
   - Converted to Tailwind using `@layer` directives
   - Button components using `@apply`
   - Section headers
   - Utility classes

3. **Navbar Component** (`components/Navbar.js`)
   - Fully converted to Tailwind classes
   - Removed all inline styles
   - Responsive design with Tailwind breakpoints

## 📋 Remaining Components to Convert

### High Priority
- [ ] `pages/Home.js` + `pages/Home.css`
- [ ] `pages/Hero.js` + `pages/Hero.css`
- [ ] `pages/Plans.js` + `pages/Plans.css`
- [ ] `pages/Services.js` + `pages/Services.css`

### Medium Priority
- [ ] `pages/Contact.js` + `pages/Contact.css`
- [ ] `pages/About.js` + `pages/About.css`
- [ ] `pages/Features.js` + `pages/Features.css`
- [ ] `pages/Team.js` + `pages/Team.css`

### Lower Priority
- [ ] `components/Footer.js` + `components/Footer.css`
- [ ] `components/Sidebar.js` + `components/Sidebar.css`
- [ ] Dashboard pages
- [ ] Admin pages

## 🔄 Conversion Process

### Step 1: Remove CSS Import
```javascript
// Before
import './Component.css';

// After
// Remove the import
```

### Step 2: Convert Classes
Replace CSS classes with Tailwind utility classes:

```javascript
// Before
<div className="card">
  <h2 className="card-title">Title</h2>
</div>

// After
<div className="bg-white/5 rounded-xl p-6 border border-white/10">
  <h2 className="text-2xl font-bold text-white mb-4">Title</h2>
</div>
```

### Step 3: Use Custom Colors
```javascript
// Use custom colors from config
className="bg-primary-500 text-white"
className="text-accent-400"
className="border-secondary-500"
```

### Step 4: Use Custom Gradients
```javascript
className="bg-gradient-button-primary"
className="bg-gradient-rainbow"
```

### Step 5: Responsive Design
```javascript
className="text-base md:text-lg lg:text-xl"
className="flex flex-col md:flex-row"
className="hidden lg:flex"
```

## 🎨 Common Patterns

### Buttons
```javascript
// Primary button
<button className="btn btn-primary">Click</button>

// Secondary button
<button className="btn btn-secondary">Click</button>

// Custom button
<button className="px-6 py-3 bg-gradient-button-primary text-white rounded-lg font-semibold hover:bg-gradient-button-primary-hover transition-all duration-300">
  Click
</button>
```

### Cards
```javascript
<div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/8 hover:border-primary-500/30 transition-all duration-300">
  {/* Card content */}
</div>
```

### Section Headers
```javascript
<div className="section-header">
  <h2 className="section-title">Title</h2>
  <p className="section-subtitle">Subtitle</p>
</div>
```

### Glass Morphism
```javascript
<div className="glass">
  {/* Content */}
</div>
```

## 📝 Notes

- All custom colors are available in Tailwind config
- Use `@apply` in CSS only for reusable component classes
- Prefer utility classes over custom CSS when possible
- Complex animations can use Tailwind's `animate-` utilities or custom CSS
- The linter warnings about `@tailwind` and `@apply` are normal and can be ignored

## 🚀 Next Steps

1. Convert Home page components
2. Convert Plans page
3. Convert Services page
4. Remove unused CSS files
5. Test all pages for visual consistency

