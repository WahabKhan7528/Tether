import ClassicTemplate from './ClassicTemplate';
import MinimalTemplate from './MinimalTemplate';
import ScrapbookTemplate from './ScrapbookTemplate';
import ElegantTemplate from './ElegantTemplate';
import VintageTemplate from './VintageTemplate';

const PALETTE_VARS = {
  default: {}, // Uses global theme colors
  monochrome: {
    '--color-surface': '15 15 15',
    '--color-surface-dim': '25 25 25',
    '--color-outline': '50 50 50',
    '--color-primary': '250 250 250',
    '--color-tertiary': '230 230 230',
  },
  ocean: {
    '--color-surface': '21 34 40',
    '--color-surface-dim': '29 45 53',
    '--color-outline': '48 76 89',
    '--color-primary': '138 185 204',
    '--color-tertiary': '224 242 241',
  },
  sunset: {
    '--color-surface': '43 20 20',
    '--color-surface-dim': '59 29 29',
    '--color-outline': '89 48 48',
    '--color-primary': '217 108 74',
    '--color-tertiary': '253 242 233',
  },
  forest: {
    '--color-surface': '24 33 26',
    '--color-surface-dim': '34 48 37',
    '--color-outline': '58 90 64',
    '--color-primary': '163 177 138',
    '--color-tertiary': '218 215 205',
  },
  royal: {
    '--color-surface': '33 24 38',
    '--color-surface-dim': '46 34 53',
    '--color-outline': '74 59 82',
    '--color-primary': '205 180 219',
    '--color-tertiary': '244 241 222',
  }
};

export default function LetterRenderer({ templateId, letter }) {
  const palette = letter?.palette || 'default';
  const customStyles = PALETTE_VARS[palette] || {};

  let TemplateComponent = ClassicTemplate;
  
  switch (templateId) {
    case 'minimal':
      TemplateComponent = MinimalTemplate;
      break;
    case 'scrapbook':
      TemplateComponent = ScrapbookTemplate;
      break;
    case 'elegant':
      TemplateComponent = ElegantTemplate;
      break;
    case 'vintage':
      TemplateComponent = VintageTemplate;
      break;
    case 'classic':
    default:
      TemplateComponent = ClassicTemplate;
      break;
  }

  return (
    <div style={customStyles} className="transition-colors duration-700 w-full h-full">
      <TemplateComponent letter={letter} />
    </div>
  );
}
