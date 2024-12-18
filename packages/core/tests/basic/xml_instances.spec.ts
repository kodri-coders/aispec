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
      'Generate a character with the name: John and the surname: Doe': {
        character: 'John Doe',
      },
      'Given the name: John select one of the surnames: Doe,Smith': {
        surname: 'Doe',
      },
      'Produce 2 surnames that sound good with the name: John': {
        surnames: ['Doe', 'Smith'],
      },
    };
    workflowRunner.callLLM = jest
      .fn()
      .mockImplementation((systemPrompt: string, prompt: string) => {
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
    expect(workflowRunner.callLLM).toHaveBeenCalledTimes(3);
    // expect(workflowRunner.logs).toMatchSnapshot();
  });
});
