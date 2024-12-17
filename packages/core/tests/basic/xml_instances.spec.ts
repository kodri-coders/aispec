import * as path from 'path';

import { Assistant } from '../../src';

const artifactPath = path.join(
  __dirname,
  'artifacts',
  'movie-builder-assistant.xml',
);
const assistant = new Assistant({ '@ref': artifactPath });
describe('assistant', () => {
  it('loads name and description', () => {
    expect(assistant.name).toMatchSnapshot();
    expect(assistant.description).toMatchSnapshot();
  });
  it('loads workflows', () => {
    expect(assistant.workflows?.length).toMatchSnapshot();
  });
  it('starts workflow', async () => {
    const workflowRunner = assistant.loadWorkflow('character-building');
    const mockResponses: any = {
      'Produce 2 surnames that sound good with the name: John': {
        surnames: ['Doe', 'Smith', 'Lan'],
      },
      'Given the name: John select one of the surnames: Doe,Smith,Lan': {
        surname: 'Doe',
      },
      'Generate 10 backstories for the character: John Doe': {
        backstories: [
          'Backstory 1',
          'Backstory 2',
          'Backstory 3',
          'Backstory 4',
          'Backstory 5',
          'Backstory 6',
          'Backstory 7',
          'Backstory 8',
          'Backstory 9',
          'Backstory 10',
        ],
      },
      'Enhance the backstory: Backstory 1': {
        title: 'Backstory 1',
        story: 'Enhanced backstory 1',
      },
      'Enhance the backstory: Backstory 2': {
        title: 'Backstory 2',
        story: 'Enhanced backstory 2',
      },
      'Enhance the backstory: Backstory 3': {
        title: 'Backstory 3',
        story: 'Enhanced backstory 3',
      },
      'Enhance the backstory: Backstory 4': {
        title: 'Backstory 4',
        story: 'Enhanced backstory 4',
      },
      'Enhance the backstory: Backstory 5': {
        title: 'Backstory 5',
        story: 'Enhanced backstory 5',
      },
      'Enhance the backstory: Backstory 6': {
        title: 'Backstory 6',
        story: 'Enhanced backstory 6',
      },
      'Enhance the backstory: Backstory 7': {
        title: 'Backstory 7',
        story: 'Enhanced backstory 7',
      },
      'Enhance the backstory: Backstory 8': {
        title: 'Backstory 8',
        story: 'Enhanced backstory 8',
      },
      'Enhance the backstory: Backstory 9': {
        title: 'Backstory 9',
        story: 'Enhanced backstory 9',
      },
      'Enhance the backstory: Backstory 10': {
        title: 'Backstory 10',
        story: 'Enhanced backstory 10',
      },
      "Generate 10 backstories for the character: John Doe": {
        backstories: [
          "Backstory 1",
          "Backstory 2",
          "Backstory 3",
          "Backstory 4",
          "Backstory 5",
          "Backstory 6",
          "Backstory 7",
          "Backstory 8",
          "Backstory 9",
          "Backstory 10",
        ],
      },
      "Enhance the backstory: Backstory 1": {
        title: "Backstory 1",
        story: "Enhanced backstory 1",
      },
      "Enhance the backstory: Backstory 2": {
        title: "Backstory 2",
        story: "Enhanced backstory 2",
      },
      "Enhance the backstory: Backstory 3": {
        title: "Backstory 3",
        story: "Enhanced backstory 3",
      },
      "Enhance the backstory: Backstory 4": {
        title: "Backstory 4",
        story: "Enhanced backstory 4",
      },
      "Enhance the backstory: Backstory 5": {
        title: "Backstory 5",
        story: "Enhanced backstory 5",
      },
      "Enhance the backstory: Backstory 6": {
        title: "Backstory 6",
        story: "Enhanced backstory 6",
      },
      "Enhance the backstory: Backstory 7": {
        title: "Backstory 7",
        story: "Enhanced backstory 7",
      },
      "Enhance the backstory: Backstory 8": {
        title: "Backstory 8",
        story: "Enhanced backstory 8",
      },
      "Enhance the backstory: Backstory 9": {
        title: "Backstory 9",
        story: "Enhanced backstory 9",
      },
      "Enhance the backstory: Backstory 10": {
        title: "Backstory 10",
        story: "Enhanced backstory 10",
      },
    };
    workflowRunner.callLLM = jest
      .fn()
      .mockImplementation((systemPrompt: string, prompt: string) => {
        console.log('prompt', prompt);
        return mockResponses[prompt];
      });
    workflowRunner.on('step-finished', (prompt: string, data: any) => {
      console.log('step finished', prompt, data);
      workflowRunner.next();
    });
    workflowRunner.on('workflow-finished', (workflow: any) => {
      console.log('workflow finished');
    });
    const workflow = workflowRunner.start({
      name: 'John',
      surnamesLength: 2,
    });
    expect(workflowRunner.assistant.toString()).toMatchSnapshot();

    await workflowRunner.onFinish();
    expect(workflowRunner.context).toMatchSnapshot();

    expect(workflowRunner.callLLM).toHaveBeenCalledTimes(14);
    expect(workflowRunner.logs).toMatchSnapshot();
  });
});
