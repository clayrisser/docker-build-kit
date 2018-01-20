import commander from 'commander';
import { version } from '../package';
import childProcess from 'child_process';
import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import _ from 'lodash';

commander.version(version);
commander.option('-t --tag [tag]', 'tag of docker image');
commander.command('build');
commander.command('pull');
commander.command('push');
commander.command('info');
commander.command('up');
commander.command('run');
commander.command('ssh');
commander.action(async (cmd, options) => {
  const compose = await new Promise((resolve, reject) => {
    fs.readFile(path.resolve(process.cwd(), 'docker-compose.yml'), (err, data) => {
      if (err) return reject(err);
      return resolve(yaml.safeLoad(data.toString()))
    });
  });
  const service = compose.services[_.keys(compose.services)[0]];
  if (!service.image.includes(':')) service.image += ':latest';
  const serviceName = _.keys(compose.services)[0];
  const imageName = service.image.replace(/\:.+$/, '');
  const tagName = commander.tag || service.image.replace(/^.+\:/, '');
  switch(cmd) {
    case 'build':
      await exec('docker', [
        'build',
        '-t',
        `${imageName}:${tagName}`,
        '-f',
        path.resolve('Dockerfile'),
        process.cwd()
      ]);
      break;
    case 'pull':
      await exec('docker', [
        'pull',
        `${imageName}:${tagName}`,
      ]);
      break;
    case 'push':
      await exec('docker', [
        'push',
        `${imageName}:${tagName}`,
      ]);
      break;
    case 'info':
      await exec('docker', [
        'inspect',
        '-f',
        '{{.Config.Labels}}',
        `${imageName}:${tagName}`
      ]);
      break;
    case 'up':
      await exec('docker-compose', [
        '-f',
        path.resolve('docker-compose.yml'),
        'up',
        '--force-recreate'
      ]);
      break;
    case 'run':
      await exec('docker-compose', [
        '-f',
        path.resolve('docker-compose.yml'),
        'run',
        serviceName
      ]);
      break;
    case 'ssh':
      let containerName = null;
      _.each(await getContainerNames(), (possibleContainerName) => {
        if (possibleContainerName.includes(serviceName.replace(/[^\w\d]/g, ''))) {
          containerName = possibleContainerName;
          return false;
        }
        return true;
      });
      if (containerName) {
        console.log(`ssh into ${containerName}`);
        await exec('docker', [
          'exec',
          '-it',
          containerName,
          '/bin/sh'
        ], { stdio: 'inherit' });
      } else {
        await exec('docker-compose', [
          '-f',
          path.resolve('docker-compose.yml'),
          'run',
          '--entrypoint',
          '/bin/sh',
          serviceName
        ], { stdio: 'inherit' });
      }
      break;
  }
}).parse(process.argv);

function exec(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const { stdout, stderr } = process;
    const proc = childProcess.spawn(cmd, args, _.assign({ shell: true }, options));
    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        stdout.write(_.clone(data.toString()));
      });
      proc.stderr.on('data', (data) => {
        stderr.write(data.toString());
      });
    }
    proc.on('close', resolve);
  });
}

function getContainerNames() {
  return new Promise((resolve, reject) => {
    const proc = childProcess.spawn('docker', [
      'ps',
      '--format',
      '{{.Names}}'
    ], { shell: true });
    proc.stdout.on('data', (data) => {
      return resolve(data.toString().split('\n').slice(0, -1));
    });
    proc.stderr.on('data', (data) => {
      return reject(new Error(data.toString()));
    });
    proc.on('close', resolve);
  });
}
