import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the iaailauncher extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'iaailauncher:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension iaailauncher is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The iaailauncher server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
