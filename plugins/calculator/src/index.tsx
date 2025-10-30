import React from 'react';
import CalculatorPage from './CalculatorPage';

// Export the component
export { CalculatorPage };

// Export route configuration
export const routes = [
  {
    path: '/calculator',
    element: React.createElement(CalculatorPage),
    name: 'Calculator',
    icon: '🧮'
  }
];

// Export plugin manifest
export const manifest = {
  name: 'calculator',
  version: '1.0.0',
  description: 'Simple calculator plugin with basic arithmetic operations',
  author: 'Plugin Developer',
  category: 'utility',
  tags: ['calculator', 'math', 'arithmetic'],
  apiPrefix: '/calculator',
  frontendRoute: 'calculator'
};

export default CalculatorPage;
