## setup

To install the latest version of kibo-sandbox-data CLI, run this command:

```bash
npm i -g @kibocommerce/kibo-sandbox-data-cli
```

## Usage

### set up env

- init a template for the environment variables

```bash
kibo-sandbox-data initEnv
```

- populate the .env file with the corresponding values for your tenant and app

```
KIBO_CLIENT_ID=******************
KIBO_SHARED_SECRET=*************
KIBO_API_BASE_URL=https://home.mozu.com
KIBO_TENANT=******
KIBO_SITE_ID=****
KIBO_MASTER_CATALOG_ID=1
KIBO_CATALOG_ID=1
```

### init a data directory ( if you dont already have one)

- run this command:

```bash
kibo-sandbox-data initDataDir
```

### view help

```
kibo-sandbox-data
```

### import all resources

```
kibo-sandbox-data import --all
```

### import categories

```
kibo-sandbox-data import --categories
```

### export products and locations

```
kibo-sandbox-data export --products --locations
```

### all options

```bash
kibo-sandbox-data <command>

Commands:
  kibo-sandbox-data export       export --categories --documents
                                 banners,hero_images
  kibo-sandbox-data import       import --products --documents
                                 banners,hero_images
  kibo-sandbox-data clean        clean --productAttributes --documents
                                 banners,hero_images
  kibo-sandbox-data initDataDir  initDataDir #copies default data directory
  kibo-sandbox-data initEnv      initEnv #copies creates an empty .env file

Options:
      --version            Show version number                         [boolean]
  -a, --all                include all resources                       [boolean]
      --data               location of data directory
                                                    [string] [default: "./data"]
      --categories         include category                            [boolean]
      --discounts          include discount                            [boolean]
      --documents          include documents from an array of lists      [array]
      --documentLists      include document lists                      [boolean]
      --documentTypes      include documentTypes                       [boolean]
      --locations          include locations                           [boolean]
      --products           include products                            [boolean]
      --productAttributes  include productAttributes                   [boolean]
      --productTypes       include productTypes                        [boolean]
      --help               Show help                                   [boolean]
```
