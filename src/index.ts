import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from "@jupyterlab/application";
import { ILauncher } from "@jupyterlab/launcher";
import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from "@jupyterlab/apputils";

import { LauncherWidget } from "./widgets/launcher";
import { LauncherIcon } from "./icons";


/**
 * Initialization data for the iaailauncher extension.
 */
class IAAILauncherPlugin implements JupyterFrontEndPlugin<void> {
  id = "iaai-launcher";
  autoStart = true;
  requires = [ICommandPalette, ILauncher];
  optional = [ILayoutRestorer];

  public activate(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    launcher: ILauncher,
    restorer: ILayoutRestorer | null
  ) {
    const command = "iaailauncher:open";
    const content = new LauncherWidget();
    let widget = new MainAreaWidget({ content });
    app.commands.addCommand(command, {
      label: "Open IAAI Launcher",
      icon: LauncherIcon,
      execute: () => {
        if (widget?.isDisposed ?? true) {
          widget = new MainAreaWidget({ content });
        }
        if (!tracker.has(widget!)) {
          // Track the state of the widget for later restoration
          tracker.add(widget!);
          console.log(widget);
        }
        if (!widget!.isAttached) {
          // Attach the widget to the main work area if it"s not there
          app.shell.add(widget!, "main");
        }

        // Activate the widget
        app.shell.activateById(widget!.id);
      }
    });

    // Add the command to the palette.
    palette.addItem({ command, category: "IAAI" });
    launcher.add({
      command: command,
      category: "HPC Tools",
      rank: 0
    });

    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget<LauncherWidget>>({
      namespace: "iaai"
    });
    if (restorer !== null) {
      restorer.restore(tracker, {
        command,
        name: () => "iaai"
      });
    }
  }
}
const plugin = new IAAILauncherPlugin();
export default plugin;
