import React from "react";
import { Notification, ReactWidget, showDialog } from "@jupyterlab/apputils";
import { ReactElement } from "react";
import { LauncherIcon, NOTIFICATION_DURATION } from "../constants";
import {
  StartContainerFormWidget,
  StartContainerFormResult,
} from "./startContainerForm";
import { LauncherButtons, LauncherInfo } from "./launcherButtons";
import { JobList } from "./jobList";
import { requestAPI } from "../handler";
import { JupyterFrontEnd } from "@jupyterlab/application";


export class LauncherWidget extends ReactWidget {

  constructor(private app: JupyterFrontEnd) {
    super();
    this.id = "iaai-launcher";
    this.title.label = "IAAI Launcher";
    this.title.closable = true;
  }

  showStartDialog(launcher: LauncherInfo): void {
    const formComponent = new StartContainerFormWidget();
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
        const requestBody = {
          scriptName: launcher.script,
          ...result.value
        };
        requestAPI("jobs", { method: "POST", body: JSON.stringify(requestBody) }).then(response => {
          Notification.info("Job Scheduled", { autoClose: NOTIFICATION_DURATION });
        }).catch(error => {
          Notification.error("Failed to Schedule Job", { autoClose: NOTIFICATION_DURATION });
          console.error(error);
        });
      }
    });
  }

  protected render(): ReactElement {
    return (
      <div>
        <div className="jp-Launcher-section">
          <div className="jp-Launcher-sectionHeader">
            <LauncherIcon.react width="16" height="16" margin="1em" />
            <h2 className="jp-Launcher-sectionTitle">Start a new Container</h2>
          </div>
          <LauncherButtons onLauncherSelected={launcher => this.showStartDialog(launcher)} />
        </div>
        <div className="jp-Launcher-section">
          <div className="jp-Launcher-sectionHeader">
            <h2 className="jp-Launcher-sectionTitle">Running Jobs</h2>
          </div>
          <JobList app={this.app} />
        </div>
      </div>
    );
  }
}
