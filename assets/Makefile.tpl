mott = ./node_modules/.bin/mott

all:
	DEBUG=mott:* $(mott) run

build:
	DEBUG=mott:* $(mott) build

deploy:
	DEBUG=mott:* $(mott)  deploy --env production

.PHONY: build