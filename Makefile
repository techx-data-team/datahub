build-frontend-dev:
	./gradlew :datahub-web-react:build -x test -x yarnTest -x yarnLint &&\
	./gradlew :datahub-frontend:dist -x yarnTest -x yarnLint -x test -x yarnBuild


build-gms-dev:
	./gradlew :metadata-service:war:build


build: build-gms-dev build-frontend-dev