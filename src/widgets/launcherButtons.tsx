import { LabIcon, } from "@jupyterlab/ui-components";
import React from "react";
import { requestAPI } from "../handler";

type LauncherButtonProps = { onLauncherSelected: (_: LauncherInfo) => void };

export type LauncherInfo = {
  icon: LabIcon,
  iconData: string,
  iconPath: string,
  name: string,
  script: string
};

type LauncherInfos = { [key: string]: LauncherInfo };

export class LauncherButtons extends React.Component<LauncherButtonProps> {

  state: { launchers: LauncherInfos, message: string | null };

  constructor(props: LauncherButtonProps) {
    super(props);
    this.state = {
      launchers: {},
      message: "Loading available launchers"
    };

    requestAPI<LauncherInfos>("launchers").then(respose => {
      const launchers = Object.entries(respose).reduce((map, [key, info]) => {
        map[key] = {
          ...info,
          icon: new LabIcon({
            name: info.iconPath,
            svgstr: info.iconData
          })
        };
        return map;
      }, {} as LauncherInfos);

      this.setState({ launchers, message: null });
    }).catch(error => {
      this.setState({ message: "Failed to fetch available Launchers" });
      console.error("IAAI Launcher: failed to get list of launchers", error);
    });
  }

  render(): React.ReactNode {
    return (
      <div className="jp-Launcher-cardContainer" style={{ justifyContent: "center" }}>
        {this.state.message ? <p>{this.state.message}</p> : ""}
        {
          Object.entries(this.state.launchers).map(([id, info]) =>
            <div key={id} className="jp-LauncherCard" title={info.name} onClick={() => this.props.onLauncherSelected?.(info)}>
              <div className="jp-LauncherCard-icon">
                <info.icon.react width={52} height={52} />
              </div>
              <div className="jp-LauncherCard-label" title={info.name}>
                <p>{info.name}</p>
              </div>
            </div>
          )
        }
      </div >)
  }
}
