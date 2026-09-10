import * as fs from 'node:fs';
import * as core from '@actions/core';

function getInput(name, deprecatedName, defaultValue = '') {
  return core.getInput(name) || core.getInput(deprecatedName) || defaultValue;
}

async function run() {
  try {
    const serverHostname = getInput('server-hostname', 'serverhostname');
    const port = core.getInput('port');
    const protocol = core.getInput('protocol');
    const apiKey = getInput('api-key', 'apikey');
    core.setSecret(apiKey);
    const project = core.getInput('project');
    const projectName = getInput('project-name', 'projectname');
    const projectVersion = getInput('project-version', 'projectversion');
    const projectTags = getInput('project-tags', 'projecttags');
    const autoCreate = getInput('auto-create', 'autocreate', 'false') !== 'false';
    const bomFilename = getInput('bom-filename', 'bomfilename', 'bom.xml');
    const parent = core.getInput('parent');
    const parentName = getInput('parent-name', 'parentname');
    const parentVersion = getInput('parent-version', 'parentversion');
    const isLatest = getInput('is-latest', 'isLatest', 'false') !== 'false';

    if (protocol !== "http" && protocol !== "https") {
      throw new Error(`protocol "${protocol}" not supported, must be one of: https, http`);
    }

    if (project === "" && (projectName === "" || projectVersion === "")) {
      throw new Error('project or project-name + project-version must be set');
    }

    if (!autoCreate && project === "") {
      throw new Error("project can't be empty if auto-create is false");
    }

    if ((parentName === "" && parentVersion !== "") || (parentName !== "" && parentVersion === "")) {
      throw new Error('parent-name + parent-version must both be set');
    }

    core.info(`Reading BOM: ${bomFilename}...`);
    let bomContents = fs.readFileSync(bomFilename);

    // Remove UTF-8 byte order mark.
    // NB: Unclear if this is really necessary, but it's existing behavior so ¯\_(ツ)_/¯
    if (bomContents[0] === 0xef && bomContents[1] === 0xbb && bomContents[2] === 0xbf) {
      bomContents = bomContents.subarray(3);
    }

    const form = new FormData();
    form.append('bom', new Blob([bomContents]), 'bom');
    if (autoCreate) {
      form.append('projectName', projectName);
      form.append('projectVersion', projectVersion);
      form.append('autoCreate', 'true');
      if (projectTags) {
        form.append('projectTags', projectTags.split(',').map(tag => tag.trim()).join(','));
      }
    } else {
      form.append('project', project);
    }

    if (isLatest) {
      form.append('isLatest', 'true');
    }

    if (parent && parent.trim().length > 0) {
      form.append('parentUUID', parent);
    } else if (parentName && parentName.trim().length > 0 && parentVersion && parentVersion.trim().length > 0) {
      form.append('parentName', parentName);
      form.append('parentVersion', parentVersion);
    }

    const requestOptions = {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: form
    };

    const url = new URL(`${protocol}://${serverHostname}`);
    if (port) {
      url.port = port;
    }
    url.pathname = '/api/v1/bom';

    core.info(`Uploading to Dependency-Track server ${serverHostname}...`);

    const response = await fetch(url.toString(), requestOptions);

    if (response.ok) {
      const responseJson = await response.json();
      core.setOutput('token', responseJson.token);
      if (responseJson.projectUuid) {
        core.setOutput('project-uuid', responseJson.projectUuid);

        // Deprecated, remove in next major version.
        core.setOutput('projectUuid', responseJson.projectUuid);
      }
      core.info('Finished uploading BOM to Dependency-Track server.');
    } else {
      const responseBody = await response.text();
      if (responseBody) {
        core.debug(responseBody);
      }
      core.setFailed('Failed response status code:' + response.status);
    }

  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
