import { spawn } from 'node:child_process'
import { lstat, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value
  for (let bit = 0; bit < 8; bit += 1)
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
  return crc >>> 0
})

function collectCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const stdout = []
    const stderr = []
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout.on('data', chunk => stdout.push(chunk))
    child.stderr.on('data', chunk => stderr.push(chunk))
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0)
        resolve(Buffer.concat(stdout))
      else
        reject(new Error(`${command} exited with code ${code}: ${Buffer.concat(stderr).toString('utf8').trim()}`))
    })
  })
}

function calculateCrc32(data) {
  let crc = 0xffffffff
  for (const byte of data)
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function createZip(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const crc = calculateCrc32(entry.data)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0x0800, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(0, 10)
    localHeader.writeUInt16LE(0x0021, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(entry.data.length, 18)
    localHeader.writeUInt32LE(entry.data.length, 22)
    localHeader.writeUInt16LE(name.length, 26)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(0x0314, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0x0800, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0x0021, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(entry.data.length, 20)
    centralHeader.writeUInt32LE(entry.data.length, 24)
    centralHeader.writeUInt16LE(name.length, 28)
    centralHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38)
    centralHeader.writeUInt32LE(offset, 42)

    localParts.push(localHeader, name, entry.data)
    centralParts.push(centralHeader, name)
    offset += localHeader.length + name.length + entry.data.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...localParts, centralDirectory, end])
}

export async function archiveDirectory(options) {
  const { courseRoot, relativeDirectory, directoryPath, outputPath, label, resolveCoursePath } = options
  const trackedOutput = await collectCommand('git', ['ls-files', '-z', '--', relativeDirectory], courseRoot)
  const trackedFiles = trackedOutput.toString('utf8').split('\0').filter(Boolean)
  if (trackedFiles.length === 0)
    throw new Error(`${label} does not contain Git-tracked files.`)

  const rootName = path.basename(directoryPath)
  const entries = []
  for (const trackedFile of trackedFiles) {
    const filePath = resolveCoursePath(trackedFile, label)
    const relativeFile = path.relative(directoryPath, filePath)
    if (!relativeFile || relativeFile.startsWith(`..${path.sep}`) || path.isAbsolute(relativeFile))
      throw new Error(`${label} contains a file outside its directory: ${trackedFile}`)
    if (!(await lstat(filePath)).isFile())
      throw new Error(`${label} contains a non-regular file: ${trackedFile}`)
    entries.push({
      name: `${rootName}/${relativeFile.split(path.sep).join('/')}`,
      data: await readFile(filePath),
    })
  }

  entries.sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)))
  await writeFile(outputPath, createZip(entries))
}
