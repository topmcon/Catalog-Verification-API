import { jest } from '@jest/globals';

// Mock OpenAI module
const mockCompletionsCreate = jest.fn();

export class OpenAI {
  chat = {
    completions: {
      create: mockCompletionsCreate
    }
  };
  
  constructor(..._args: any[]) {
    // Mock constructor
  }
}

export default OpenAI;

// Export mock function for test access
export const getMockCompletionsCreate = () => mockCompletionsCreate;
