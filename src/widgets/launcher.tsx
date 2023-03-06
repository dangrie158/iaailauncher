import React from "react";
import { ReactWidget, showDialog } from "@jupyterlab/apputils";
import { ReactElement } from "react";
import { LauncherIcon } from "../icons";
import {
  StartContainerFormWidget,
  StartContainerFormResult,
  StartContainerFormProps
} from "./startContainerForm";
import { requestAPI } from "../handler";
import { LauncherButtons, LauncherInfo } from "./launcherButtons";


export class LauncherWidget extends ReactWidget {

  constructor() {
    super();
    this.id = "iaai-launcher";
    this.title.label = "IAAI Launcher";
    this.title.closable = true;
  }

  showStartDialog(launcher: LauncherInfo): void {
    requestAPI<StartContainerFormProps>("get_user_data").then(respose => {
      const formComponent = new StartContainerFormWidget(respose);
      showDialog<StartContainerFormResult>({
        title: `Start a new ${launcher.name} Container`,
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
    });
  }

  protected render(): ReactElement {
    return (
      <div className="jp-Launcher-section">
        <div className="jp-Launcher-sectionHeader">
          <LauncherIcon.react width="16" height="16" margin="1em"></LauncherIcon.react>
          <h2 className="jp-Launcher-sectionTitle">Start a new Container</h2>
        </div>
        <LauncherButtons onLauncherSelected={launcher => this.showStartDialog(launcher)}></LauncherButtons>
      </div >
    );
  }
}
