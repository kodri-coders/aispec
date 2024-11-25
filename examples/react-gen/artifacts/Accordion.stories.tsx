import React from 'react';
import { Meta, Story } from '@storybook/react';
import Accordion, { AccordionProps } from './AccordionComponent';

export default {
  title: 'Components/Accordion',
  component: Accordion,
} as Meta;

const Template: Story<AccordionProps> = (args) => <Accordion {...args} />;

export const Default = Template.bind({});
Default.args = {
  sections: [
    {
      header: 'Section 1',
      content: 'This is the content for section 1.',
    },
    {
      header: 'Section 2',
      content: 'This is the content for section 2.',
    },
    {
      header: 'Section 3',
      content: 'This is the content for section 3.',
    },
  ],
};

export const WithListContent = Template.bind({});
WithListContent.args = {
  sections: [
    {
      header: 'Section 1',
      content: (
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      ),
    },
    {
      header: 'Section 2',
      content: (
        <ol>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ol>
      ),
    },
  ],
};