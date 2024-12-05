import { Assistant } from '../../src/index'
import * as path from 'path'
const artifactPath = path.join(__dirname, 'artifacts', 'movie-builder-assistant.xml')
const assistant = new Assistant({"@ref":artifactPath})
describe('assistant', () => {
  it('loads name and description', () => {
    expect(assistant.name).toMatchSnapshot()
    expect(assistant.description).toMatchSnapshot()
  })
  it('loads xml', () => {
    expect(assistant).toMatchSnapshot() 
  })
  it('loads workflows', () => {
    expect(assistant.workflows).toMatchSnapshot()
  })
  it('starts workflow', async () => {
    const workflowRunner = assistant.loadWorkflow('character-building')
    const mockResponses: any = {
      'Produce 2 surnames that sound good with the name: John': {
        surnames: ['Doe', 'Smith']
      },
      'Given the name: John select one of the surnames: Doe,Smith': {
        surname: 'Doe'
      },
      'Generate a character with the name: John and the surname: Doe': {
        character: 'John Doe'
      }
    }
    // mock workflow.generateResponse with jest based
    workflowRunner.generateResponse = jest.fn().mockImplementation((prompt: string) => {
      console.log('prompt', prompt)
      return mockResponses[prompt]
    })
    workflowRunner.on('step-finished', (prompt: string, data: any) => {
      console.log('step finished', prompt, data)
      workflowRunner.next()
    })
    workflowRunner.on('workflow-finished', (workflow: any) => {
      console.log('workflow finished')
    })
    const workflow = workflowRunner.start({
      name: 'John',
      surnamesLength: 2,
    })

    console.log('workflow', workflow)
    await workflowRunner.onFinish()
    expect(workflowRunner.generateResponse).toHaveBeenCalledTimes(3)
    expect(workflowRunner.history).toMatchSnapshot()
  })
})
