import React from "react";
import { requestAPI } from "../handler";
import { NOTIFICATION_DURATION } from "../constants";
import { copyIcon, stopIcon, launchIcon, fileIcon } from "@jupyterlab/ui-components";
import { Notification } from "@jupyterlab/apputils";
import { JupyterFrontEnd } from "@jupyterlab/application";


const REFRESH_INTERVAL = 1000;
const NON_CANCELLABLE_STATES = ["CANCELLED", "COMPLETED", "FAILED"];

export type JobInfo = {
  id: string;
  name: string;
  state: string;
  reason: string;
  resources: { cpu: number, gpu: number };
  time: string;
  node?: string;
  openUrl?: string;
  copyUrl?: string;
  outputFile?: string;
  password?: string;
};

type JobListProps = { app: JupyterFrontEnd };

export class JobList extends React.Component<JobListProps> {

  state: { jobs: JobInfo[], message: string | null };
  intervalId: number | undefined;

  constructor(props: JobListProps) {
    super(props);
    this.state = {
      jobs: [],
      message: "Loading jobs"
    };
    this.refreshList();
  }

  componentDidMount() {
    this.intervalId = setInterval(() => this.refreshList(), REFRESH_INTERVAL);
  }

  componentWillUnmount(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => {
        Notification.success("Credentials copied to Clipboard", { autoClose: NOTIFICATION_DURATION });
      }).catch(error => {
        console.error(error);
        Notification.error("Failed to copy Password", { autoClose: NOTIFICATION_DURATION });
      });
  }

  killJob(job: JobInfo) {
    requestAPI<void>(`jobs`, { method: "delete", body: job.id })
      .then(() => {
        Notification.success("Kill signal sent", { autoClose: NOTIFICATION_DURATION })
      }).catch((error) => {
        console.error(error);
        Notification.error("Failed to send kill Signal", { autoClose: NOTIFICATION_DURATION });
      });
  }

  openJobOutput(job: JobInfo) {
    this.props.app.commands.execute("docmanager:open", { path: job.outputFile });
  }

  refreshList() {
    requestAPI<JobInfo[]>("jobs").then(respose => {
      this.setState({ jobs: respose, message: null });
    }).catch(error => {
      this.setState({ message: "Failed to fetch available Jobs" });
      console.error("IAAI Launcher: failed to get list of jobs", error);
    });
  }

  render(): React.ReactNode {
    return (
      <div>
        {this.state.message ? <p>{this.state.message}</p> : ""}
        <table className="job-list" style={{ display: this.state.message ? "none" : "table" }}>
          <thead>
            <tr>
              <th className="test-right">Job ID</th>
              <th>Name</th>
              <th>State</th>
              <th>Resources</th>
              <th>Runtime</th>
              <th>Node</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.state.jobs.map((job) =>
              <tr key={job.id}>
                <td className="text-monospace">{job.id}</td>
                <td className="text-monospace">{job.name}</td>
                <td>{job.state}</td>
                <td>CPUs:&nbsp;{job.resources.cpu}{job.resources.gpu ? <span>&nbsp;/&nbsp;GPUs:&nbsp;{job.resources.gpu}</span> : ""} </td>
                <td className="text-monospace">{job.time ? job.time : <p className="muted">n/a</p>}</td>
                <td>{job.node ? <p>{job.node}</p> : <p className="muted">n/a</p>}</td>
                <td className="action-container">
                  {job.openUrl && job.state == "RUNNING" ? <a title="Open in new Window" className="action" target="_blank" href={job.openUrl}><launchIcon.react height={24} tag="span" /><span className="action-label">Open</span></a> : <a className="action"></a>}
                  {job.password ? <a title="Copy to Clipboard" className="action" onClick={() => { this.copyToClipboard(job.password!) }} ><copyIcon.react height={24} tag="span" /><span className="action-label">Copy Creds</span></a> : <a className="action"></a>}
                  {!NON_CANCELLABLE_STATES.includes(job.state) ? <a title="Stop Job" className="action" onClick={() => this.killJob(job)}><stopIcon.react height={24} tag="span" /><span className="action-label">Stop</span></a> : <a className="action"></a>}
                  {job.outputFile ? <a title="Open Output" className="action" onClick={() => this.openJobOutput(job)}><fileIcon.react height={24} tag="span" /><span className="action-label">Output</span></a> : <a className="action"></a>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div >)
  }
}
