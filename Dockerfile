FROM alpine:latest

LABEL image=jamrizzi/docker-build-kit:latest \
      maintainer="Jam Risser <jam@jamrizzi.com> (https://jam.jamrizzi.com)" \
      base=alpine:3.6

RUN apk add --no-cache \
      tini

WORKDIR /opt/app

RUN echo "Hello, world!" > hello

ENTRYPOINT ["/sbin/tini", "--", "tail", "-f", "/opt/app/hello"]
