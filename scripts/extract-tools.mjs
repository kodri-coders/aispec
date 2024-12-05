import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import ts from 'typescript';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function findToolFiles() {
  return new Promise((resolve, reject) => {
    glob('src/tools/**/index.ts', { cwd: projectRoot }, (err, files) => {
      if (err) reject(err);
      else resolve(files.map(f => join(projectRoot, f)));
    });
  });
}

function extractToolIds(sourceFile) {
  const tools = [];

  function visit(node) {
    // Look for variable declarations
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      
      // Check if it has a type annotation
      if (declaration.type && 
          ts.isTypeReferenceNode(declaration.type) && 
          declaration.type.typeName.getText() === 'Tool') {
        
        // Get the initializer object
        const initializer = declaration.initializer;
        if (initializer && ts.isObjectLiteralExpression(initializer)) {
          // Find the id property
          const idProperty = initializer.properties.find(prop => 
            ts.isPropertyAssignment(prop) && 
            prop.name.getText() === 'id'
          );
          
          if (idProperty && ts.isPropertyAssignment(idProperty)) {
            const idValue = idProperty.initializer.getText().replace(/['"]/g, '');
            const nameProperty = initializer.properties.find(prop => 
              ts.isPropertyAssignment(prop) && 
              prop.name.getText() === 'name'
            );
            const descProperty = initializer.properties.find(prop => 
              ts.isPropertyAssignment(prop) && 
              prop.name.getText() === 'description'
            );
            
            tools.push({
              id: idValue,
              name: nameProperty ? nameProperty.initializer.getText().replace(/['"]/g, '') : '',
              description: descProperty ? descProperty.initializer.getText().replace(/['"]/g, '') : ''
            });
          }
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return tools;
}

async function main() {
  try {
    // Find all tool files
    const files = await findToolFiles();
    const allTools = [];
    
    // Process each file
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      const tools = extractToolIds(sourceFile);
      if (tools.length > 0) {
        allTools.push({
          file: file.replace(projectRoot + '/', ''),
          tools
        });
      }
    }
    
    // Output results
    console.log('Found tools:');
    console.log(JSON.stringify(allTools, null, 2));
    
    // Create a markdown summary
    const markdown = ['# Available Tools\n'];
    
    for (const fileTools of allTools) {
      markdown.push(`## ${fileTools.file}\n`);
      for (const tool of fileTools.tools) {
        markdown.push(`### ${tool.name}`);
        markdown.push(`- ID: \`${tool.id}\``);
        markdown.push(`- Description: ${tool.description}\n`);
      }
      markdown.push('---\n');
    }
    
    // Write markdown file
    await fs.writeFile(
      join(projectRoot, 'docs', 'tools.md'), 
      markdown.join('\n')
    );
    
    console.log('Generated tools documentation in docs/tools.md');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
