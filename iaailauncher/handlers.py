import json
from contextlib import suppress

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from iaailauncher import config


class UserDataHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "maxCPUs": 4,
            "maxGPUs": 1,
            "nodes": ["hal9k", "glados"],
            "maxRuntime": "1-0:0:0"
        }))

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
        with open(config.LAUNCHERS_INFO_FILE) as launchersFile:
            launchers = json.load(launchersFile)

        launchersWithImageData = {
            launcher: self.load_image_data(data)
            for launcher, data in launchers.items()
        }

        self.finish(json.dumps(launchersWithImageData))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, "iaailauncher", "get_user_data"), UserDataHandler),
        (url_path_join(base_url, "iaailauncher", "get_launchers"), LauncherDataHandler),
        ]
    web_app.add_handlers(host_pattern, handlers)
