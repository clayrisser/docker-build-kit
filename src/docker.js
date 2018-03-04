import easycp, { readcp } from 'easycp';
import path from 'path';

export default class Docker {
  async build({
    image,
    dockerfile = path.resolve(process.cwd(), 'Dockerfile'),
    context = process.cwd()
  }) {
    return easycp('docker', ['build', '-t', image, '-f', dockerfile, context]);
  }

  async getContainerNames() {
    const result = await readcp('docker', ['ps', '--format', '{{.Names}}']);
    return result.split('\n').slice(0, -1);
  }

  async info(image) {
    return easycp('docker', ['inspect', '-f', '{{.Config.Labels}}', image]);
  }

  async pull({ image }) {
    return easycp('docker', ['pull', image]);
  }

  async push({ image }) {
    return easycp('docker', ['push', image]);
  }

  async run({ image, port }) {
    return easycp('docker', [
      'run',
      '--rm',
      '--name',
      `some-${image}`,
      port ? '--port' : '',
      port || '',
      image
    ]);
  }
}
