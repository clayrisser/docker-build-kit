# docker-build-kit

[![Beerpay](https://beerpay.io/jamrizzi/docker-build-kit/badge.svg?style=beer-square)](https://beerpay.io/jamrizzi/docker-build-kit)
[![Beerpay](https://beerpay.io/jamrizzi/docker-build-kit/make-wish.svg?style=flat-square)](https://beerpay.io/jamrizzi/docker-build-kit?focus=wish)
[![GitHub stars](https://img.shields.io/github/stars/jamrizzi/docker-build-kit.svg?style=social&label=Stars)](https://github.com/jamrizzi/docker-build-kit)

Tooling for building and testing docker images

![](assets/docker-build-kit.png)

Please &#9733; this repo if you found it useful &#9733; &#9733; &#9733;


## Features

* Supports docker-compose.yml
* Works with stdio
* SSH into containers
* Organize tagging


## Installation

```sh
npm install -g dbk
```


## Dependencies

* [NodeJS](https://nodejs.org)
* [Docker](https://www.docker.com)


## Usage

```sh
dbk -h
```

```sh
  Usage: dbk [options] [command]


  Options:

    -V, --version           output the version number
    -c --compose [path]     docker compose path
    -f --dockerfile [path]  dockerfile path
    -i --image [name]       name of image
    -r --root [path]        root path
    -s --service [name]     name of the service
    -t --tag [name]         tag of docker image
    -v --verbose            verbose logging
    --root-context          use root path as context path
    -h, --help              output usage information


  Commands:

    build [service]
    info [service]
    pull [service]
    push [service]
    run [service]
    ssh [service]
    up
```


## Support

Submit an [issue](https://github.com/jamrizzi/docker-build-kit/issues/new)


## Contributing

Review the [guidelines for contributing](https://github.com/jamrizzi/docker-build-kit/blob/master/CONTRIBUTING.md)


## License

[MIT License](https://github.com/jamrizzi/docker-build-kit/blob/master/LICENSE)

[Jam Risser](https://jam.jamrizzi.com) &copy; 2018


## Changelog

Review the [changelog](https://github.com/jamrizzi/docker-build-kit/blob/master/CHANGELOG.md)


## Credits

* [Jam Risser](https://jam.jamrizzi.com) - Author


## Support on Beerpay (actually, I drink coffee)

A ridiculous amount of coffee :coffee: :coffee: :coffee: was consumed in the process of building this project.

[Add some fuel](https://beerpay.io/jamrizzi/docker-build-kit) if you'd like to keep me going!

[![Beerpay](https://beerpay.io/jamrizzi/docker-build-kit/badge.svg?style=beer-square)](https://beerpay.io/jamrizzi/docker-build-kit)
[![Beerpay](https://beerpay.io/jamrizzi/docker-build-kit/make-wish.svg?style=flat-square)](https://beerpay.io/jamrizzi/docker-build-kit?focus=wish)
