import _ from 'lodash';
import boom from 'boom';
import commander from 'commander';
import easycp from 'easycp';
import fs from 'fs';
import joi from 'joi';
import path from 'path';
import yaml from 'js-yaml';
import validate from 'easy-joi';
import docker from './docker';
import error from './error';
import { version } from '../package.json';

commander.version(version);
commander.option('-i --image [image]', 'name of image');
commander.option('-s --service [service]', 'name of the service');
commander.option('-t --tag [tag]', 'tag of docker image');
commander.option('-v --verbose', 'verbose logging');
commander.command('build');
commander.command('pull');
commander.command('push');
commander.command('info');
commander.command('up');
commander.command('run [service]');
commander.command('ssh [service]');
commander.action((cmd, options) => action(cmd, options).catch(error));
commander.parse(process.argv);

async function action(cmd, options) {
  let argument = null;
  if (_.isString(options)) argument = options;
  let compose = await new Promise(resolve => {
    fs.readFile(
      path.resolve(process.cwd(), 'docker-compose.yml'),
      (err, data) => {
        if (err) return resolve(null);
        return resolve(yaml.safeLoad(data.toString()));
      }
    );
  });
  if (commander.service)
    await validate(commander.service || '', joi.string(), 'service');
  if (commander.tag) await validate(commander.tag || '', joi.string(), 'tag');
  if (!compose) compose = {};
  if (!compose.version) compose.services = compose;
  const serviceName =
    commander.service || argument || _.keys(compose.services)[0];
  const service = _.get(compose, ['services', serviceName]);
  if (!service) throw boom.badRequest('service does not exist');
  let image = commander.image || service.image;
  if (!image || commander.image)
    await validate(commander.image || '', joi.string(), 'image');
  if (!image.includes(':')) image += ':latest';
  const imageName = image.replace(/\:.+$/, '');
  const tagName = commander.tag || image.replace(/^.+\:/, '');
  switch (cmd) {
    case 'build':
      await docker.build({ image: `${imageName}:${tagName}` });
      break;
    case 'pull':
      await docker.pull({ image: `${imageName}:${tagName}` });
      break;
    case 'push':
      await docker.push({ image: `${imageName}:${tagName}` });
      break;
    case 'info':
      await docker.info({ image: `${imageName}:${tagName}` });
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
      await easycp('docker-compose', [
        '-f',
        path.resolve(process.cwd(), 'docker-compose.yml'),
        'run',
        serviceName
      ]);
      break;
    case 'ssh':
      {
        let containerName = null;
        _.each(await docker.getContainerNames(), possibleContainerName => {
          if (possibleContainerName.includes(`_${serviceName}`)) {
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
              serviceName
            ],
            { stdio: 'inherit' }
          );
        }
      }
      break;
  }
}
