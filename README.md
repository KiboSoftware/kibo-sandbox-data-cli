# usage

## setup

- clone the repo
- install the dependencies
```
$ npm i
```
- copy the env template to .env
```
$ cp env_template .env
```
- put the appropriate values in the .env file
```
KIBO_CLIENT_ID=
KIBO_SHARED_SECRET=
KIBO_API_BASE_URL=
KIBO_TENANT=
KIBO_SITE_ID=
KIBO_MASTER_CATALOG_ID=1
KIBO_CATALOG_ID=1
```

## usage

### import

* all
```
$ npm run import:all
```

### export

* all
``` 
$ npm run export:all 
```
* just documents
```
$ npm run export:documents 
```
