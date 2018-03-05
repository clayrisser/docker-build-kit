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
commander.option('-c --compose [path]', 'docker compose path');
commander.option('-f --dockerfile [path]', 'dockerfile path');
commander.option('-i --image [name]', 'name of image');
commander.option('-r --root [path]', 'root path');
commander.option('-s --service [name]', 'name of the service');
commander.option('-t --tag [name]', 'tag of docker image');
commander.option('-v --verbose', 'verbose logging');
commander.option('--root-context', 'use root path as context path');
commander.command('build [service]');
commander.command('info [service]');
commander.command('pull [service]');
commander.command('push [service]');
commander.command('run [service]');
commander.command('ssh [service]');
commander.command('up');
commander.action((cmd, options) => action(cmd, options).catch(error));
commander.parse(process.argv);

async function action(cmd, options) {
  let argument = null;
  if (_.isString(options)) argument = options;
  if (commander.compose)
    await validate(commander.compose || '', joi.string(), 'compose');
  if (commander.dockerfile)
    await validate(commander.dockerfile || '', joi.string(), 'dockerfile');
  if (commander.root)
    await validate(commander.root || '', joi.string(), 'root');
  const rootPath = path.resolve(process.cwd(), commander.root || '');
  const composePath = path.resolve(
    rootPath,
    commander.compose || 'docker-compose.yml'
  );
  let compose = await new Promise(resolve => {
    fs.readFile(composePath, (err, data) => {
      if (err) return resolve(null);
      return resolve(yaml.safeLoad(data.toString()));
    });
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
  let servicePath = rootPath;
  if (fs.existsSync(path.resolve(rootPath, serviceName))) {
    servicePath = path.resolve(rootPath, serviceName);
  }
  let tagPath = servicePath;
  if (fs.existsSync(path.resolve(servicePath, tagName))) {
    tagPath = path.resolve(servicePath, tagName);
  }
  const dockerfilePath = path.resolve(
    tagPath,
    commander.dockerfile || 'Dockerfile'
  );
  switch (cmd) {
    case 'build':
      await docker.build({
        image: `${imageName}:${tagName}`,
        dockerfile: dockerfilePath,
        context: commander.rootContext ? rootPath : servicePath
      });
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
        composePath,
        'up',
        '--force-recreate'
      ]);
      break;
    case 'run':
      if (commander.image || commander.tag) {
        throw boom.badRequest(
          'user the docker cli to run custom images and tags'
        );
      } else {
        await easycp('docker-compose', ['-f', composePath, 'run', serviceName]);
      }
      break;
    case 'ssh':
      {
        let containerName = null;
        const rootFolderName = rootPath.replace(/^.*\//g, '');
        _.each(await docker.getContainerNames(), possibleContainerName => {
          if (
            possibleContainerName.includes(`${rootFolderName}_${serviceName}`)
          ) {
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
            ['-f', composePath, 'run', '--entrypoint', '/bin/sh', serviceName],
            { stdio: 'inherit' }
          );
        }
      }
      break;
  }
}
