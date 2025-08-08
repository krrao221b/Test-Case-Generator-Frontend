# AI Test Case Generator - Frontend

A modern React frontend application for the AI Test Case Generator, built with Material-UI and following best coding practices.

## 🚀 Features

- **Modern Tech Stack**: React 18, TypeScript, Material-UI, Vite
- **Clean Architecture**: Organized folder structure with separation of concerns
- **Type Safety**: Full TypeScript implementation with proper type definitions
- **Responsive Design**: Mobile-first responsive UI using Material-UI
- **Error Handling**: Comprehensive error boundaries and user feedback
- **State Management**: Custom React hooks for API operations
- **Routing**: React Router for navigation between pages
- **Form Handling**: React Hook Form with validation
- **API Integration**: Axios with interceptors for API communication

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Navigation.tsx
│   │   ├── JiraInputForm.tsx
│   │   ├── ManualInputForm.tsx
│   │   └── TestCasePreview.tsx
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── TestCaseGeneratorPage.tsx
│   │   ├── TestCaseReviewPage.tsx
│   │   └── TestCaseLibraryPage.tsx
│   ├── services/          # API service layer
│   │   ├── apiClient.ts
│   │   ├── testCaseService.ts
│   │   ├── jiraService.ts
│   │   ├── zephyrService.ts
│   │   └── index.ts
│   ├── hooks/             # Custom React hooks
│   │   ├── useTestCases.ts
│   │   ├── useJira.ts
│   │   ├── useZephyr.ts
│   │   └── index.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/         # App constants and configuration
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── vite-env.d.ts      # Vite environment types
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root of the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_JIRA_BASE_URL=https://your-domain.atlassian.net
   VITE_ZEPHYR_BASE_URL=https://api.zephyrscale.smartbear.com
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Architecture & Best Practices

### Component Architecture

- **Functional Components**: Using React functional components with hooks
- **TypeScript**: Full type safety with interfaces and type definitions
- **Props Interface**: Each component has well-defined props interfaces
- **Error Boundaries**: Graceful error handling with Error Boundary component

### State Management

- **Custom Hooks**: Encapsulate complex state logic in custom hooks
- **Local State**: Using useState for component-level state
- **API State**: Dedicated hooks for API operations (useTestCases, useJira, useZephyr)

### API Integration

- **Axios Client**: Centralized API client with interceptors
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Type Safety**: Typed API responses and request payloads
- **Loading States**: Proper loading and error state management

### Styling

- **Material-UI**: Consistent design system with Material-UI
- **Theme**: Centralized theme configuration
- **Responsive**: Mobile-first responsive design
- **Accessibility**: Following Material-UI accessibility guidelines

### Code Organization

- **Barrel Exports**: Using index.ts files for clean imports
- **Path Aliases**: TypeScript path mapping for clean import statements
- **Separation of Concerns**: Clear separation between UI, logic, and data layers

## 🔌 API Integration

The frontend communicates with the backend through the following endpoints:

### Test Case Generation
- `POST /api/generate` - Generate test cases from requirements
- `GET /api/testcases` - Get all test cases
- `POST /api/testcases` - Save new test case
- `PUT /api/testcases/:id` - Update test case
- `DELETE /api/testcases/:id` - Delete test case

### Jira Integration
- `GET /api/jira/ticket/:id` - Fetch Jira ticket
- `GET /api/jira/projects` - Get Jira projects

### Zephyr Integration
- `POST /api/zephyr/push` - Push test cases to Zephyr Scale
- `GET /api/zephyr/projects` - Get Zephyr projects

## 🎨 UI Components

### Core Pages

1. **Home Page**: Overview and quick start options
2. **Generator Page**: Input forms for Jira and manual entry
3. **Review Page**: Edit and validate generated test cases
4. **Library Page**: Browse and manage test case collection

### Reusable Components

- **Navigation**: Side navigation with routing
- **Error Boundary**: Error handling and recovery
- **Form Components**: Input forms for different data types
- **Preview Components**: Display generated test cases

## 🚧 Development Notes

### Current Status

This is the initial frontend structure with:
- ✅ Project setup and configuration
- ✅ Type definitions and interfaces
- ✅ Service layer architecture
- ✅ Custom hooks for state management
- ✅ Core components and pages
- ✅ Routing and navigation
- ⏳ Full component implementations (in progress)
- ⏳ Form validation and error handling
- ⏳ Backend integration testing

### Next Steps for Development

1. **Install Dependencies**: Run `npm install` to install all required packages
2. **Complete Components**: Finish implementing all component features
3. **Add Validation**: Implement form validation with React Hook Form
4. **Test Integration**: Test with backend API endpoints
5. **Add Error Handling**: Implement comprehensive error handling
6. **Optimize Performance**: Add memoization and performance optimizations
7. **Add Tests**: Implement unit and integration tests

### Environment Setup

After running `npm install`, the following packages will be available:
- React 18 with TypeScript
- Material-UI with icons
- React Router for navigation
- Axios for API calls
- React Hook Form for form handling
- Notistack for notifications
- Vite for fast development

## 🤝 Contributing

1. Follow the established folder structure
2. Use TypeScript for all new components
3. Implement proper error handling
4. Add appropriate type definitions
5. Follow Material-UI design patterns
6. Write clean, commented code

## 📝 Notes

- The frontend is designed to work with the Node.js/Express backend
- All API calls are typed and include proper error handling
- The UI follows Material Design principles
- Components are designed to be reusable and maintainable
- State management uses modern React patterns with hooks
