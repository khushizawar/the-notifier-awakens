import React, { Component } from 'react';
import './App.css';

import { APIService } from './services';
import { ComponentController } from './controllers';
import {
  defaultApis,
  defaultAffiliationSettings,
  defaultSettings,
} from './defaults';

class App extends Component {
  constructor() {
    super();
    const { affiliation } = defaultSettings;
    const { components } = defaultAffiliationSettings[affiliation];

    this.updateData = this.updateData.bind(this);

    this.APIService = new APIService(defaultApis, this.updateData, components);
    this.ComponentController = new ComponentController(components);

    this.state = {
      data: {},
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

  startAPIs() {
    this.APIService.start();
  }
  stopAPIs() {
    this.APIService.stop();
  }
  updateAPIs() {
    this.APIService.update();
  }

  render() {
    const componentsRendered = this.ComponentController.renderComponents(
      this.state.data,
    );

    return (
      <div className="App">
        <div className="component-container">{componentsRendered}</div>
      </div>
    );
  }
}

export default App;
