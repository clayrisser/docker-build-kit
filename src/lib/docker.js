import easycp, { readcp } from 'easycp';
import path from 'path';

class Docker {
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

  async info({ image }) {
    return easycp('docker', ['inspect', '-f', '{{.Config.Labels}}', image]);
  }

  async pull({ image }) {
    return easycp('docker', ['pull', image]);
  }

  async push({ image }) {
    return easycp('docker', ['push', image]);
  }

  async run({ image, name = 'some-contianer' }) {
    return easycp('docker', ['run', '--rm', '--name', name, image]);
  }
}

export default new Docker();
