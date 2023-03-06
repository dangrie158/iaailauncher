import React from "react";
import { ReactWidget, showDialog } from "@jupyterlab/apputils";
import { ReactElement, JSXElementConstructor } from "react";
import { LauncherIcon, VSCodeIcon, JupyterLabIcon } from "../icons";
import {
  StartContainerFormWidget,
  StartContainerFormResult
} from "./startContainerForm";

export class LauncherWidget extends ReactWidget {
  constructor() {
    super();
    this.id = "iaai-launcher";
    this.title.label = "IAAI Launcher";
    this.title.closable = true;
  }

  showStartDialog(): void {
    const formComponent = new StartContainerFormWidget({
      maxCPUs: 4,
      maxGPUs: 1,
      nodes: ["hal9k", "glados"],
      maxRuntime: "1-0:0:0"
    });
    showDialog<StartContainerFormResult>({
      title: "Start a new Container",
      body: formComponent,
      host: document.body,
      buttons: [
        {
          label: "Start",
          iconClass: "",
          iconLabel: "",
          caption: "Start a container with the specified Setting",
          className: "",
          accept: true,
          actions: [],
          displayType: "default"
        },
        {
          label: "Cancel",
          iconClass: "",
          iconLabel: "",
          caption: "Cancel",
          className: "",
          accept: false,
          actions: [],
          displayType: "default"
        }
      ],
      checkbox: null,
      defaultButton: 0,
      focusNodeSelector: ".my-input",
      hasClose: true,
      renderer: undefined
    }).then(result => {
      if (result.button.accept) {
        console.log(result.value);
      }
    });
  }

  protected render(): ReactElement<any, string | JSXElementConstructor<any>> {
    return (
      <div className="jp-Launcher-section">
        <div className="jp-Launcher-sectionHeader">
          <LauncherIcon.react width="16" height="16"></LauncherIcon.react>
          <h2 className="jp-Launcher-sectionTitle">Start a new Container</h2>
        </div>
        <div className="jp-Launcher-cardContainer">
          <div
            className="jp-LauncherCard"
            onClick={() => this.showStartDialog()}
            title="VS Code Server"
          >
            <div className="jp-LauncherCard-icon">
              <VSCodeIcon.react width="52" height="52"></VSCodeIcon.react>
            </div>
            <div className="jp-LauncherCard-label" title="VS Code">
              <p>VS Code Server</p>
            </div>
          </div>
          <div className="jp-LauncherCard" title="Jupyter Lab">
            <div className="jp-LauncherCard-icon">
              <JupyterLabIcon.react
                width="52"
                height="52"
              ></JupyterLabIcon.react>
            </div>
            <div className="jp-LauncherCard-label" title="Jupyter Lab">
              <p>Jupyter Lab</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
