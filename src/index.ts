import * as core from '@actions/core'
import * as gh from '@actions/github'
import * as fs from 'fs'
import { GitHub } from '@actions/github/lib/utils'
import { DefaultArtifactClient } from '@actions/artifact'
import { Context } from '@actions/github/lib/context'
import { randomUUID } from 'crypto'
import * as path from 'path'

type Conclusions = 'success' | 'failure' | 'neutral' | 'action_required' | 'cancelled' | 'skipped' | 'stale' | 'timed_out' | undefined

const CONCLUSION_VALUES = [
  'success',
  'failure',
  'neutral',
  'action_required'
]

interface Inputs {
  file: string
  artifact: string
  check_name: string
  conclusion: string
  token: string
  md: string
}

const parseInput = (): Inputs => {
  const inputs = {
    file: '',
    artifact: '',
    check_name: '',
    conclusion: '',
    token: '',
    md: ''
  }
  inputs.file = core.getInput('file', { required: false })
  inputs.md = core.getInput('markdown', { required: false })
  inputs.artifact = core.getInput('artifact', { required: false })
  inputs.check_name = core.getInput('check_name', { required: false })
  inputs.conclusion = core.getInput('conclusion', { required: false })
  inputs.token = core.getInput('token', { required: false })
  if (inputs.md !== '' && (inputs.file !== '' || inputs.artifact !== '')) {
    core.setFailed('Provided Markdown while also providing a file based option')
  }
  if (inputs.file === '' && inputs.artifact !== '') {
    core.setFailed('Provided artifact with no file path')
  }
  if (!fs.existsSync(inputs.file) && inputs.artifact === '') {
    core.setFailed(`Could not find file ${inputs.file}`)
  }
  if (!CONCLUSION_VALUES.includes(inputs.conclusion)) {
    core.setFailed(`Conclusion value of ${inputs.conclusion} is not valid. Values can be ${CONCLUSION_VALUES.join(',')}`)
  }
  if (inputs.check_name === '') {
    inputs.check_name = path.basename(inputs.file)
  }
  core.debug('inputs')
  core.debug(JSON.stringify(inputs))
  return inputs
}

const getArtifact = async (inputs: Inputs): Promise<string> => {
  const artifact = new DefaultArtifactClient()
  const { artifacts } = await artifact.listArtifacts({ latest: true })
  const ids = artifacts.filter(a => a.name === inputs.artifact)
  let id: number
  if (ids.length === 1) {
    id = ids[0].id
    const { downloadPath } = await artifact.downloadArtifact(id, {
      path: `./${randomUUID()}`
    })
    fs.readdirSync(downloadPath ?? '', { recursive: true }).forEach(v => core.debug(v))
    if (downloadPath !== undefined) {
      if (!fs.existsSync(core.toPlatformPath(`${downloadPath}/${inputs.file}`))) {
        core.setFailed(`Downloaded artifact did not contain file at specified input: ${inputs.file}`)
      }
      return core.toPlatformPath(`${downloadPath}/${inputs.file}`)
    } else {
      core.setFailed('Download artifact failed')
    }
  } else {
    core.setFailed(`Could not find artifact with name ${inputs.artifact}`)
  }
  return ''
}

const createCheck = async (file: string, isFile: boolean, octokit: InstanceType<typeof GitHub>, context: Context, inputs: Inputs): Promise<void> => {
  let mdFile = ''
  if (isFile) {
    mdFile = fs.readFileSync(file).toString('utf-8')
  } else {
    mdFile = file
  }

  const createResp = await octokit.rest.checks.create({
    head_sha: context.sha,
    name: inputs.check_name,
    status: 'completed',
    conclusion: inputs.conclusion as Conclusions,
    output: {
      title: inputs.check_name,
      summary: '',
      text: mdFile
    },
    ...context.repo
  })
  core.info(`Check run create response: ${createResp.status}`)
  core.info(`Check run URL: ${createResp.data.url}`)
  core.info(`Check run HTML: ${createResp.data.html_url ?? ''}`)
}

// Main method
async function run (): Promise<void> {
  try {
    const inputs = parseInput()
    const context = gh.context
    const octokit = gh.getOctokit(inputs.token)
    let dlFile: string
    if (inputs.artifact !== '') {
      dlFile = await getArtifact(inputs)
      await createCheck(dlFile, true, octokit, context, inputs)
    } else {
      if (inputs.md !== '') {
        await createCheck(inputs.md, false, octokit, context, inputs)
      } else {
        await createCheck(inputs.file, true, octokit, context, inputs)
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error)
    else core.setFailed(JSON.stringify(error))
  }
}

run().catch(error => {
  if (error instanceof Error) core.setFailed(error)
  else core.setFailed(JSON.stringify(error))
})
