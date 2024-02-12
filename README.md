# markdown-to-summary-action

> ### A GitHub action to post a markdown file to a action summary check.

## Features

- Can work from files in workspace
- Can work with files from artifacts
- Control on conclusion of the check
- Control on the name of the check
- Already on `node20`

> [!IMPORTANT]
> Artifact support is via `v4` artifacts only

## Usage

```yaml
- name: markdown-to-summary-action
  id: md
  uses: mediatech15/markdown-to-summary-action@v1
  with:
    file: 'md.md'
    check_name: md
    conclusion: success

# artifact version

- name: markdown-to-summary-action
  id: md2
  uses: mediatech15/markdown-to-summary-action@v1
  with:
    file: 'files/markdown.md'
    artifact: test-artifact
    check_name: md-artifact
    conclusion: neutral
```

### Inputs Explained

|name|default|about|
|---|:---:|---|
|`file`|Required `none`|the file to use. if artifact mode it is the path to file within artifact|
|`artifact`|`empty`|the name of the artifact to pull|
|`check_name`|filename|the name of the check to show in the run. defaults to the files name|
|`conclusion`|`success`|the outcome of the check. can be `success`, `failure`, `action_required`, `neutral`|

## Multiple files?

> [!TIP]
> Run the action multiple times

## Permissions

- `checks`: `write`
- `actions`: `read`

## Screenshots

![Screenshot](/images/custom-name.png)
![Screenshot](/images/default-name.png)
![Screenshot](/images/list.png)

## License
The scripts and documentation in this project are released under the MIT License