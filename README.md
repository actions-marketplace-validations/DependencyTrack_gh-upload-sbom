# Upload BOM to Dependency-Track action

This action uploads a software bill of materials file to a Dependency-Track server.

This action is currently in "preview". Please try it out and let me know if you come across any issues.

## Inputs

### `serverhostname`

**Required** Dependency-Track hostname

### `apikey`

**Required** Dependency-Track API key

### `projectname`

**Required** Project name in Dependency-Track

### `projectversion`

**Required** Project version in Dependency-Track

### `autocreate`

**Required** Automatically create project and version in Dependency-Track, default `True`

### `bomfilename`

**Required** Path and filename of the BOM, default `bom.xml`

## Example usage

uses: coderpatros/upload-bom-to-dependency-track
env:
  APIKEY: ${{ secrets.DEPENDENCYTRACK_APIKEY }}
with:
  serverhostname: 'example.com'
  apikey: $APIKEY
  projectname: 'Example Project'
  projectversion: 'master'