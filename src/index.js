import _ from 'lodash';
import commander from 'commander';
import easycp from 'easycp';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Docker from './docker';
import { version } from '../package.json';

const docker = new Docker();

commander.version(version);
commander.option('-t --tag [tag]', 'tag of docker image');
commander.command('build');
commander.command('pull');
commander.command('push');
commander.command('info');
commander.command('up');
commander.command('run [service]');
commander.command('ssh [service]');
commander
  .action(async (cmd, options) => {
    let argument = null;
    if (typeof options === 'string') argument = options;
    const compose = await new Promise((resolve, reject) => {
      fs.readFile(
        path.resolve(process.cwd(), 'docker-compose.yml'),
        (err, data) => {
          if (err) return reject(err);
          return resolve(yaml.safeLoad(data.toString()));
        }
      );
    });
    const service = compose.services[_.keys(compose.services)[0]];
    if (!service.image.includes(':')) service.image += ':latest';
    const serviceName = _.keys(compose.services)[0];
    const imageName = service.image.replace(/\:.+$/, '');
    const tagName = commander.tag || service.image.replace(/^.+\:/, '');
    switch (cmd) {
      case 'build':
        await docker.build(`${imageName}:${tagName}`);
        break;
      case 'pull':
        await docker.pull(`${imageName}:${tagName}`);
        break;
      case 'push':
        await docker.push(`${imageName}:${tagName}`);
        break;
      case 'info':
        await docker.info(`${imageName}:${tagName}`);
        break;
      case 'up':
        await easycp('docker-compose', [
          '-f',
          path.resolve(process.cwd(), 'docker-compose.yml'),
          'up',
          '--force-recreate'
        ]);
        break;
      case 'run':
        {
          let currentServiceName = serviceName;
          if (argument) currentServiceName = argument;
          await easycp('docker-compose', [
            '-f',
            path.resolve(process.cwd(), 'docker-compose.yml'),
            'run',
            currentServiceName
          ]);
        }
        break;
      case 'ssh':
        {
          let containerName = null;
          let currentServiceName = serviceName;
          if (argument) currentServiceName = argument;
          _.each(await docker.getContainerNames(), possibleContainerName => {
            if (possibleContainerName.includes(`_${currentServiceName}`)) {
              containerName = possibleContainerName;
              return false;
            }
            return true;
          });
          if (containerName) {
            process.stdout.write(`ssh into ${containerName}\n`);
            await easycp('docker', ['exec', '-it', containerName, '/bin/sh'], {
              stdio: 'inherit'
            });
          } else {
            await easycp(
              'docker-compose',
              [
                '-f',
                path.resolve('docker-compose.yml'),
                'run',
                '--entrypoint',
                '/bin/sh',
                currentServiceName
              ],
              { stdio: 'inherit' }
            );
          }
        }
        break;
    }
  })
  .parse(process.argv);
