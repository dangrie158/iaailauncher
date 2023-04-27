import React from "react";
import { ReactWidget, Notification } from "@jupyterlab/apputils";
import { NOTIFICATION_DURATION } from "../constants";
import { ReactElement } from "react";
import { requestAPI } from "../handler";

const AVAILABLE_PARTITIONS = {
  cpu: "CPU",
  gpu: "GPU"
};
const DEFAULT_RUNTIME = "0-4:00:00";

export type UserInfoReponse = {
  maxCPUs: number;
  maxGPUs: number;
  maxRuntime: string;
  nodes: string[];
};

export type StartContainerFormResult = {
  partition: "cpu" | "gpu";
  cpuCount: number;
  gpuCount: number;
  asRoot: boolean;
  nodeList: { [key: string]: boolean };
  maxRuntime: string;
};

class StartContainerForm extends React.Component<{}> {
  state: { result: StartContainerFormResult, userInfo: UserInfoReponse };
  constructor(props: {}) {
    super(props);

    this.state = {
      result: {
        partition: "cpu",
        cpuCount: 1,
        gpuCount: 1,
        asRoot: false,
        nodeList: {},
        maxRuntime: DEFAULT_RUNTIME
      },
      userInfo: {
        maxCPUs: 4,
        maxGPUs: 1,
        maxRuntime: DEFAULT_RUNTIME,
        nodes: [],
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleNodelistChange = this.handleNodelistChange.bind(this);

    requestAPI<UserInfoReponse>("user_data").then(response => {
      const nodeStates = response.nodes.reduce((map, nodeName, index) => {
        map[nodeName] = true;
        return map;
      }, {} as { [key: string]: boolean });

      this.setState({
        userInfo: response,
        result: {
          ...this.state.result,
          nodeList: nodeStates,
          maxRuntime: response.maxRuntime || DEFAULT_RUNTIME
        }
      })
    }).catch(error => {
      Notification.error("Nutzer wurde nicht gefunden. Bitte beantragen sie einen Account.", { autoClose: NOTIFICATION_DURATION })
      console.error("Failed to load User defaults", error)
    });
  }

  handleChange(
    target: string,
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    this.setState({
      result: {
        ...this.state.result,
        [target]: event.target.value
      }
    });
  }

  handleNodelistChange(nodeName: string): void {
    this.setState({
      result: {
        ...this.state.result,
        nodeList: {
          ...this.state.result.nodeList,
          [nodeName]: !this.state.result.nodeList[nodeName]
        }
      }
    });
  }

  render(): ReactElement {
    return (
      <form>
        <fieldset className="fieldset">
          <legend className="form-legend">Resources</legend>
          Partition
          <div className="form-group-inline">
            {Object.entries(AVAILABLE_PARTITIONS).map(([key, name]) =>
              <div key={key}>
                <input
                  type="radio"
                  id={key}
                  name="partition"
                  value={key}
                  onChange={event => this.handleChange("partition", event)}
                  checked={this.state.result.partition === key}
                />
                <label htmlFor={key}>{name}</label>
              </div>
            )}
          </div>

          <div className="form-group-inline">
            <label htmlFor="cpuCount">
              CPU Count
            </label>
            <input
              id="cpuCount"
              name="cpuCount"
              required={true}
              type="number"
              min="1"
              disabled={this.state.result.partition == "gpu"}
              max={this.state.userInfo.maxCPUs}
              value={this.state.result.partition === "cpu" ? this.state.result.cpuCount : this.state.result.gpuCount * 4}
              onChange={event => this.handleChange("cpuCount", event)}
            />
          </div>

          <div className="form-group-inline">
            <label htmlFor="gpuCount">
              GPU Count
            </label>
            <input
              id="gpuCount"
              name="gpuCount"
              required={true}
              type="number"
              min={this.state.result.partition == "gpu" ? 1 : 0}
              disabled={this.state.result.partition === "cpu"}
              max={this.state.userInfo.maxGPUs}
              value={this.state.result.partition === "gpu" ? this.state.result.gpuCount : 0}
              onChange={event => this.handleChange("gpuCount", event)}
            />
          </div>
        </fieldset>
        <details className="fieldset">
          <summary>Advanced Options</summary>
          <div className="form-group-inline">
            <label htmlFor="maxRuntime">
              Maximum Runtime
            </label>
            <input
              id="maxRuntime"
              name="maxRuntime"
              required={true}
              type="input"
              pattern="(?:\d+-)?(?:\d{1,2}:){0,2}(?:\d{1,2})"
              value={this.state.result.maxRuntime}
              onChange={event => this.handleChange("maxRuntime", event)}
            />
          </div>
          <div className="form-group-inline">
            <label htmlFor="asRoot">
              Run as Root?
            </label>
            <input
              id="asRoot"
              name="asRoot"
              type="checkbox"
              checked={this.state.result.asRoot}
              onChange={event => this.handleChange("asRoot", event)}
            />
          </div>
          <fieldset>
            <legend className="form-legend">Nodelist</legend>
            {Object.entries(this.state.result.nodeList).map(([nodeName, isActive]) => {
              return (
                <div key={nodeName} className="form-group-inline">
                  <input
                    type="checkbox"
                    name="nodeList"
                    checked={isActive}
                    onChange={event => this.handleNodelistChange(nodeName)}
                  />
                  <label htmlFor={nodeName}>{nodeName}</label>
                </div>
              );
            })}
          </fieldset>
        </details>
      </form>
    );
  }
}

export class StartContainerFormWidget extends ReactWidget {
  form: React.RefObject<StartContainerForm>;

  constructor() {
    super();
    this.id = "iaai-startform";
    this.form = React.createRef();
  }

  getValue(): StartContainerFormResult {
    let formState = this.form.current!.state.result;
    if (formState.partition == "gpu") {
      formState.cpuCount = formState.gpuCount * 4;
    } else {
      formState.gpuCount = 0;
    }

    return formState;
  }

  render(): JSX.Element {
    return (
      <StartContainerForm ref={this.form} />
    );
  }
}
