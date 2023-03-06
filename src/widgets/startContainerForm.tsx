import React from "react";
import { ReactWidget } from "@jupyterlab/apputils";
import { ReactElement } from "react";

const AVAILABLE_PARTITIONS = {
  cpu: "CPU",
  gpu: "GPU"
};

export type StartContainerFormProps = {
  maxCPUs: number;
  maxGPUs: number;
  maxRuntime: string;
  nodes: string[];
};

export type StartContainerFormResult = {
  cpuCount: number;
  gpuCount: number;
  nodeList: { [key: string]: boolean };
  partition: "cpu" | "gpu";
  maxRuntime: string;
};

class StartContainerForm extends React.Component<StartContainerFormProps> {
  state: StartContainerFormResult;
  constructor(props: StartContainerFormProps) {
    super(props);
    const nodeStates = props.nodes.reduce((map, nodeName, index) => {
      map[nodeName] = true;
      return map;
    }, {} as { [key: string]: boolean });
    this.state = {
      cpuCount: 1,
      gpuCount: 0,
      nodeList: nodeStates,
      partition: "cpu",
      maxRuntime: props.maxRuntime
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleNodelistChange = this.handleNodelistChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(
    target: string,
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    this.setState({ [target]: event.target.value });
  }

  handleNodelistChange(nodeName: string): void {
    this.setState({
      nodeList: {
        ...this.state.nodeList,
        [nodeName]: !this.state.nodeList[nodeName]
      }
    });
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    console.log(this.state);
    event.preventDefault();
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
                  checked={this.state.partition === key}
                ></input>
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
              max={this.props.maxCPUs}
              value={this.state.cpuCount}
              onChange={event => this.handleChange("cpuCount", event)}
            ></input>
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
              min="0"
              max={this.props.maxGPUs}
              value={this.state.gpuCount}
              onChange={event => this.handleChange("gpuCount", event)}
            ></input>
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
              value={this.state.maxRuntime}
              onChange={event => this.handleChange("maxRuntime", event)}
            ></input>
          </div>
          <fieldset>
            <legend className="form-legend">Nodelist</legend>
            {Object.entries(this.state.nodeList).map(([nodeName, isActive]) => {
              return (
                <div key={nodeName} className="form-group-inline">
                  <input
                    type="checkbox"
                    name="nodeList"
                    checked={isActive}
                    onChange={event => this.handleNodelistChange(nodeName)}
                  ></input>
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
  props: StartContainerFormProps;
  form: React.RefObject<StartContainerForm>;

  constructor(props: StartContainerFormProps) {
    super();
    this.id = "iaai-startform";
    this.props = props;
    this.form = React.createRef();
  }

  getValue(): StartContainerFormResult {
    return this.form.current!.state;
  }

  render(): JSX.Element {
    return (
      <StartContainerForm
        nodes={this.props.nodes}
        maxCPUs={this.props.maxCPUs}
        maxGPUs={this.props.maxGPUs}
        maxRuntime={this.props.maxRuntime}
        ref={this.form}
      />
    );
  }
}
