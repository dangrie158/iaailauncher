import asyncio
import getpass
import json
import logging
import os
from contextlib import suppress
from pathlib import Path
from typing import List, Tuple, Union

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from slurmbridge import Job, Node, User

from iaailauncher import config

logger = logging.getLogger("iaailauncher")


class UserDataHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        nodes = await Node.all()
        nodelist = [node.node_name for node in nodes]

        username = getpass.getuser()
        users = await User.filter(user=username)
        if len(users) == 0:
            self.set_status(404)
            self.finish("Current User has no Slurm account")
            return

        user = users[0]
        self.finish(
            json.dumps(
                {
                    "maxCPUs": user.max_cpus,
                    "maxGPUs": user.max_gpus,
                    "nodes": nodelist,
                    "maxRuntime": user.grp_wall,
                }
            )
        )


class LauncherDataHandler(APIHandler):
    def load_image_data(self, data):
        iconData = ""
        with suppress(Exception):
            if iconPath := (config.LAUNCHERS_BASE / data.get("iconPath")):
                with open(iconPath) as iconFile:
                    iconData = iconFile.read()
        data["iconData"] = iconData
        return data

    @tornado.web.authenticated
    def get(self):
        with open(config.LAUNCHERS_INFO_FILE) as launchers_file:
            launchers = json.load(launchers_file)

        launchersWithImageData = {launcher: self.load_image_data(data) for launcher, data in launchers.items()}

        self.finish(json.dumps(launchersWithImageData))


class JobsDataHandler(APIHandler):
    def initialize(self):
        self.notebook_dir = os.environ.get("HOME")

    async def run_sbatch_command(
        cls,
        script_path: str,
        arguments: List[str],
        script_arguments: List[str],
    ) -> Tuple[Union[int, None], str]:
        if config.SBATCH_PATH is None:
            raise ImportError("sbatch could not be found in path.")

        process = await asyncio.create_subprocess_exec(
            config.SBATCH_PATH,
            *arguments,
            "--parsable",
            script_path,
            *script_arguments,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        process_output = (stderr if len(stderr) > 0 else stdout).decode("ascii")

        return process.returncode, process_output

    @tornado.web.authenticated
    async def get(self):
        username = getpass.getuser()
        job_list = [job for job in await Job.all() if job.username == username]
        job_list = sorted(job_list, key=lambda x: int(x.job_id), reverse=True)
        job_ids_with_launcher_info = [file.stem for file in config.LAUNCHERS_RUN_DIR.iterdir()]

        jobs = []
        for job in job_list:
            # get the information about the deployment if this job is launched by a launcher script
            launcher_info = {}
            if job.job_id in job_ids_with_launcher_info:
                with open(config.LAUNCHERS_RUN_DIR / f"{job.job_id}.json") as launcher_file:
                    launcher_info = json.load(launcher_file)

            output_file_path = None
            if job.std_out:
                output_file_path = str(Path(job.std_out).relative_to(self.notebook_dir))
            jobs.append(
                {
                    "id": job.job_id,
                    "name": job.job_name,
                    "reason": job.reason,
                    "resources": {"cpu": job.cpus, "gpu": job.gpus},
                    "state": job.job_state,
                    "time": job.run_time,
                    "node": job.node_list,
                    "outputFile": output_file_path,
                    **launcher_info,
                }
            )

        self.finish(json.dumps(jobs))

    @tornado.web.authenticated
    async def delete(self):
        job_id = self.get_json_body()
        job_list = await Job.all()
        job = next(filter(lambda x: x.job_id == str(job_id), job_list))
        await job.kill()
        self.finish()

    @tornado.web.authenticated
    async def post(self):
        job_spec = self.get_json_body()

        target_partition = job_spec.get("partition")
        run_as_root = job_spec.get("asRoot", False)
        available_nodes = [node.node_name for node in await Node.all() if target_partition in node.partitions]

        output_path = config.LAUNCHERS_VAR_DIR / "%A.log"

        script_path = config.LAUNCHERS_BASE / job_spec["scriptName"]
        node_excludelist = [
            node_name
            for node_name, active in job_spec.get("nodeList").items()
            if not active or node_name not in available_nodes
        ]

        arguments = [
            "--partition",
            target_partition,
            "--cpus-per-task",
            str(job_spec.get("cpuCount")).strip(),
            "--time",
            str(job_spec.get("maxRuntime")).strip(),
            "--output",
            str(output_path).strip(),
        ]

        if len(node_excludelist) > 0:
            arguments += ["--exclude", ",".join(node_excludelist)]

        if target_partition == "gpu":
            arguments += ["--gres", f"gpu:{job_spec.get('gpuCount')}"]

        script_arguments = []
        if run_as_root:
            script_arguments += ["--root"]

        exit_code, stdout = await self.run_sbatch_command(str(script_path), arguments, script_arguments)
        if exit_code != 0:
            logger.error(stdout)
            self.set_status(500)
            self.finish(stdout)
            return

        self.finish(stdout)


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # we need to enable hidden file access to be able to open logs
    web_app.settings["contents_manager"].allow_hidden = True
    handlers = [
        (url_path_join(base_url, "iaailauncher", "user_data"), UserDataHandler),
        (url_path_join(base_url, "iaailauncher", "launchers"), LauncherDataHandler),
        (url_path_join(base_url, "iaailauncher", "jobs"), JobsDataHandler),
    ]
    web_app.add_handlers(host_pattern, handlers)
