import React, { Component } from 'react';
import Style from 'style-it';

import './App.css';

import { APIService } from './services';
import { ComponentController } from './controllers';
import {
  defaultApis,
  defaultAffiliationSettings,
  defaultSettings,
  defaultTranslations,
  styles,
} from './defaults';
import { DEBUG } from './constants';

class App extends Component {
  constructor() {
    super();
    const { affiliation = 'debug' } = defaultSettings;
    const {
      components = [],
      layouts = {},
      style = 'online',
    } = defaultAffiliationSettings[affiliation];

    this.updateData = this.updateData.bind(this);

    this.APIService = new APIService(
      defaultApis,
      this.updateData,
      defaultSettings,
      components,
    );
    this.ComponentController = new ComponentController(
      components,
      defaultSettings,
      defaultTranslations,
    );

    this.state = {
      data: {},
      components,
      layouts,
      style,
      settings: defaultSettings,
    };

    this.startAPIs();
  }

  updateData(key, data) {
    this.ComponentController.update(key, data);
    const newData = Object.assign({}, this.state.data, {
      [key]: data,
    });
    this.setState(
      Object.assign({}, this.state, {
        data: newData,
      }),
    );
  }

  updateSettings(settings) {
    this.APIService.updateSettings(settings);
    this.ComponentController.updateSettings(settings);
    this.setState(
      Object.assign({}, this.state, {
        settings,
      }),
    );
  }

  startAPIs() {
    this.APIService.start();
  }
  stopAPIs() {
    this.APIService.stop();
  }
  updateAPIs() {
    this.APIService.update();
  }

  /**
   * Get a CSS grid-template value from layout array.
   * 
   * Examples:
```javascript
getGridTemplateFromLayoutArray(['a b', 'a b']) => '"a b" "a b" / 1fr 1fr'
getGridTemplateFromLayoutArray(['a a', '. b b']) => '"a a ." ". b b" / 1fr 1fr 1fr'
getGridTemplateFromLayoutArray(['a', 'a b b']) => '"a . ." "a b b" / 1fr 1fr 1fr'
```
   * 
   * @param {array} layout Array with placed components.
   * 
   * @returns {string} A string for grid-template.
   */
  getGridTemplateFromLayoutArray(layout) {
    const cols = layout.reduce(
      (acc, row) => Math.max(acc, row.split(' ').length),
      0,
    );
    const wrappedInQuotes = layout
      .map(
        e =>
          `"${e + ' .'.repeat((cols - (e.split(' ').length % cols)) % cols)}"`,
      )
      .join(' ');

    return `${wrappedInQuotes} /${' 1fr'.repeat(cols)}`;
  }

  /**
   * Make it possible to input a list of components and get
   * a grid-template which wraps to correct size.
   * 
   * Examples:
```javascript
const components = [
  { template: 'Bus' },
  { template: 'Clock' },
  { template: 'Office' },
]

generateDefaultGridTemplateFromComponents(components, 1) => ['Bus', 'Clock', 'Office']
generateDefaultGridTemplateFromComponents(components, 2) => ['Bus Clock', 'Office .']
generateDefaultGridTemplateFromComponents(components, 3) => ['Bus Clock Office']
```
   * @param {array} components List of components in view.
   * @param {number} width When to wrap.
   * 
   * @returns {array} A grid-template value.
   */
  generateDefaultGridTemplateFromComponents(components, width = 1) {
    let gridTemplate = [];
    const count = components.length;
    let lastIndex = -1;
    for (let i = 0; i < count; i += width) {
      gridTemplate.push(
        components
          .slice(i, i + width)
          .map(component => `${component.id || component.template}`)
          .join(' '),
      );
      lastIndex++;
    }
    gridTemplate[lastIndex] += ' .'.repeat((width - (count % width)) % width);

    return gridTemplate;
  }

  /**
   * Generate layout CSS from a layout object.
   * 
   * Examples:
```javascript
layouts = {
  0: ['Clock', 'Clock2', 'Office', 'Bus'],
  400: ['Clock Clock2 Office Office', 'Bus Bus'],
  800: ['Office Clock Clock2', 'Bus Bus Bus'],
}

generateLayoutCSS(layouts) => `
.component-container {
  grid-template: "Clock" "Clock2" "Office" "Bus" / 1fr;
}
@media (min-width: 400px) {
  .component-container {
    grid-template:"Clock Clock2 Office Office" "Bus Bus . ." / 1fr 1fr 1fr 1fr;
  }
}
@media (min-width: 800px) {
  .component-container {
    grid-template:"Office Clock Clock2" "Bus Bus Bus" / 1fr 1fr 1fr;
  }
}
`
```
   * @param {object} layouts Object defined as {[size: number]: grid: string[]}
   */
  generateLayoutCSS(layouts, containerClass = 'component-container') {
    if (Array.isArray(layouts)) {
      return layouts.reduce((acc, grid, index) => {
        let size = 0;
        switch (index) {
          case 0:
            size = 0;
            break;
          case 1:
            size = 720;
            break;
          case 2:
            size = 1400;
            break;
          default:
            size = 1400 + 360 * Math.max(0, index - 2);
            break;
        }
        if (size === 0) {
          return `${acc}
.${containerClass} {
  grid-template: ${this.getGridTemplateFromLayoutArray(grid)};
}`;
        }

        return `${acc}
@media (min-width: ${size}px) {
  .${containerClass} {
    grid-template:${this.getGridTemplateFromLayoutArray(grid)};
  }
}`;
      }, '');
    }
    return Object.entries(layouts).reduce((acc, [size, grid]) => {
      if (size === '0') {
        return `${acc}
.${containerClass} {
  grid-template: ${this.getGridTemplateFromLayoutArray(grid)};
}`;
      }

      return `${acc}
@media (min-width: ${size}px) {
  .${containerClass} {
    grid-template:${this.getGridTemplateFromLayoutArray(grid)};
  }
}`;
    }, '');
  }

  render() {
    const { data, layouts } = this.state;
    const componentsRendered = this.ComponentController.renderComponents(data);

    let globalCSS = `
.component {
  ${DEBUG ? 'border: 1px solid rgba(255, 0, 0, .5);' : ''}
}

${this.generateLayoutCSS(layouts)}
`;
    if (this.state.settings.style in styles) {
      globalCSS += styles[this.state.settings.style];
    } else {
      if (this.state.style in styles) {
        globalCSS += styles[this.state.style];
      } else {
        if (this.state.settings.affiliation in styles) {
          globalCSS += styles[this.state.settings.affiliation];
        }
      }
    }

    return (
      <Style>
        {globalCSS}
        <div className="App">
          <div className="component-container">{componentsRendered}</div>
        </div>
      </Style>
    );
  }
}

export default App;
