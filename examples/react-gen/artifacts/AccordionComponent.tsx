import React, { useState } from 'react';

interface Section {
  header: string;
  content: React.ReactNode;
}

interface AccordionProps {
  sections: Section[];
}

const Accordion: React.FC<AccordionProps> = ({ sections }) => {
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index);
  };

  return (
    <div className='w-full'>
      {sections.map((section, index) => (
        <div key={index} className='border-b border-gray-200'>
          <button
            className='w-full text-left py-2 px-4 focus:outline-none focus:ring'
            onClick={() => toggleSection(index)}
            aria-expanded={activeSection === index}
          >
            {section.header}
          </button>
          <div
            className={`overflow-hidden transition-max-height duration-300 ${activeSection === index ? 'max-h-screen' : 'max-h-0'}`}
            aria-hidden={activeSection !== index}
          >
            <div className='py-2 px-4'>
              {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;