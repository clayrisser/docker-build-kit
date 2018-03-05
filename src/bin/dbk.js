#!/usr/bin/env node

import 'babel-polyfill';
import commander from 'commander';
import action from '../lib/action';
import error from '../lib/error';
import { version } from '../package';

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
