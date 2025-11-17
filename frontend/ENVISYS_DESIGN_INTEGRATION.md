# ENVISys Design System Integration

## Overview

The ENVISys Design System has been successfully integrated into the Thesis Management System frontend. This professional, nature-themed design system provides a cohesive visual language optimized for academic environmental science research management.

## Design System Specifications

### Color Palette
- **Primary Green**: #15803d (main), #86efac (light), #14532d (dark)
- **Secondary Blue**: #2563eb (main), #93c5fd (light), #1e3a8a (dark)
- **Accent Purple**: #9333ea (main), #d8b4fe (light), #6b21a8 (dark)
- **Amber Orange**: #d97706 (main), #fde68a (light), #92400e (dark)
- **Status Red**: #dc2626 (main), #fecaca (light), #991b1b (dark)
- **Neutral Grays**: #f8fafc (background), #0f172a (text), #64748b (muted)

### Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Headings**: 30px (H1) to 12px (H6) with 600 weight
- **Body Text**: 14px with 400 weight, 20px line height
- **Buttons**: 14px with 500 weight
- **Captions**: 12px with 400 weight

### Layout & Spacing
- **Border Radius**: 8px (standard), 12px (large), 4px (small)
- **Spacing**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Shadows**: Subtle 0 1px 3px for cards, elevated 0 10px 15px for hover states
- **Transitions**: 150ms ease for all interactions

## Components

### 1. ENVISysSidebar
- **Purpose**: Main navigation sidebar with role-based menu items
- **Features**:
  - Gradient green background (#166534 to #14532d)
  - Role-specific navigation items
  - Active state highlighting
  - ENVISys branding with leaf emoji
  - Fixed positioning with 256px width

**Usage**:
```tsx
<ENVISysSidebar currentPath="/" userRole="STUDENT" />
```

### 2. ENVISysHeader
- **Purpose**: Top navigation bar with search and user profile
- **Features**:
  - Search bar with hover/focus states
  - Notification badge
  - User profile with role indicator
  - Fixed positioning below sidebar

**Usage**:
```tsx
<ENVISysHeader 
  userName="John Doe" 
  userRole="STUDENT" 
  notificationCount={3}
  onSearch={(value) => console.log(value)}
/>
```

### 3. ENVISysStatCard
- **Purpose**: Display key metrics and statistics
- **Features**:
  - Customizable icon and color
  - Hover animations
  - Optional trend indicators
  - Clean, card-based design

**Usage**:
```tsx
<ENVISysStatCard
  title="Active Theses"
  value="48"
  icon={<School />}
  color="#15803d"
  trend={{ direction: 'up', value: '+12%' }}
/>
```

### 4. ENVISysButton
- **Purpose**: Consistent button styling across the application
- **Variants**:
  - Primary (green background)
  - Secondary (blue background)
  - Outline (transparent with border)
  - Ghost (transparent, hover background)
  - Danger (red background)

**Usage**:
```tsx
<ENVISysButton variant="primary" size="medium" onClick={handleClick}>
  Submit
</ENVISysButton>
```

### 5. ENVISysBadge
- **Purpose**: Status indicators and labels
- **Variants**:
  - Status (green, for active/inactive states)
  - Priority (amber, for urgency levels)
  - Role (blue, for user roles)
  - Progress (purple, for workflow stages)

**Usage**:
```tsx
<ENVISysBadge variant="status" status="active">
  Active
</ENVISysBadge>
```

### 6. ENVISysDashboard
- **Purpose**: Complete dashboard layout with role-specific content
- **Features**:
  - Role-based statistics cards
  - Recent activity feed
  - Quick action buttons
  - Responsive grid layout

**Usage**:
```tsx
<ENVISysDashboard
  userRole="STUDENT"
  userName="John Doe"
  currentPath="/"
/>
```

## Theme Integration

The ENVISys theme is applied globally through Material-UI's ThemeProvider:

```tsx
// src/main.tsx
import envisysTheme from './theme/figmaTheme'

<ThemeProvider theme={envisysTheme}>
  <App />
</ThemeProvider>
```

### Theme Overrides

The theme includes comprehensive MUI component overrides:
- **Buttons**: Custom colors, border radius, hover states
- **Cards**: White background, subtle shadows, hover animations
- **AppBar**: White header with bottom border
- **TextField**: Consistent styling with focus states
- **Chips**: Color variants for different statuses
- **Tables**: Hover states and consistent borders
- **Progress**: Green primary color

## Role-Based Design

The design system adapts to different user roles:

### Admin
- Focus on system management metrics
- Access to all administrative functions
- Purple accent color for admin-specific elements

### Student
- Thesis progress tracking
- Document management focus
- Green primary color for student actions

### Adviser
- Student progress monitoring
- Review and approval workflows
- Blue accent color for adviser tools

### Panel
- Evaluation and review focus
- Defense scheduling
- Amber accent color for panel activities

## Implementation Status

✅ **Completed**:
- Theme configuration (figmaTheme.ts)
- Core ENVISys components
- Dashboard integration
- Global theme application

🔄 **Next Steps**:
- Update remaining pages to use ENVISys components
- Apply design system to forms and modals
- Implement responsive design optimizations
- Add accessibility improvements

## File Structure

```
src/
├── theme/
│   └── figmaTheme.ts          # ENVISys theme configuration
├── components/
│   └── ENVISysComponents/
│       ├── ENVISysSidebar.tsx
│       ├── ENVISysHeader.tsx
│       ├── ENVISysStatCard.tsx
│       ├── ENVISysButton.tsx
│       ├── ENVISysBadge.tsx
│       ├── ENVISysDashboard.tsx
│       └── index.ts
└── pages/
    └── Dashboard.tsx           # Updated to use ENVISysDashboard
```

## Benefits

1. **Consistency**: Unified visual language across all components
2. **Professionalism**: Clean, academic-appropriate design
3. **Usability**: Clear visual hierarchy and intuitive interactions
4. **Accessibility**: High contrast ratios and readable typography
5. **Maintainability**: Centralized theme configuration
6. **Role Awareness**: Adaptive design for different user types

## Browser Compatibility

The ENVISys Design System is compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- CSS transitions use transform for optimal performance
- Theme is loaded once and applied globally
- Component lazy loading can be implemented for large applications
- Icons use Material-UI's optimized SVG components

This design system provides a solid foundation for the thesis management system while maintaining the professional, nature-inspired aesthetic appropriate for academic environmental science research.
