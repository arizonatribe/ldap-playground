SHELL := /bin/bash
NAME = ldap-playground
VERSION = 1.0.0

all: docker clean up

docker:
	@docker build --rm=true -t $(NAME):$(VERSION) ./
	@docker tag -f $(NAME):$(VERSION) $(NAME):latest

docker-nocache:
	@docker build --no-cache=true --rm=true -t $(NAME):$(VERSION) ./
	@docker tag -f $(NAME):$(VERSION) $(NAME):latest

up:
	@docker-compose up

clean:
	@docker-compose rm --force