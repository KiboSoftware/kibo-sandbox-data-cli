# Kibo Sandbox Data CLI

A command-line tool for exporting, importing, syncing, and cleaning data between Kibo Commerce environments.

## Setup

To install the latest version of kibo-sandbox-data CLI, run this command:

```bash
npm i -g @kibocommerce/kibo-sandbox-data-cli
```

## Usage

### Set up environment configuration

Initialize a template for the environment variables:

```bash
kibo-sandbox-data initEnv
```

This creates a `.env.yaml` file. Populate it with the corresponding values for your tenant and application:

- Configuration under `export` is the source Kibo environment when running `export` or `sync` commands
- Configuration under `import` is the destination Kibo environment when running `import` or `sync` commands
- Configuration under `clear` is the target environment when running the `clean` command

```yaml
export:
  KIBO_CLIENT_ID: ******************
  KIBO_SHARED_SECRET: *************
  KIBO_API_BASE_URL: https://home.mozu.com
  KIBO_TENANT: ******
  KIBO_SITE_ID: ****
  KIBO_MASTER_CATALOG_ID: 1
  KIBO_CATALOG_ID: 1

import:
  KIBO_CLIENT_ID: ******************
  KIBO_SHARED_SECRET: *************
  KIBO_API_BASE_URL: https://home.mozu.com
  KIBO_TENANT: ******
  KIBO_SITE_ID: ****
  KIBO_MASTER_CATALOG_ID: 1
  KIBO_CATALOG_ID: 1

clear:
  KIBO_CLIENT_ID: ******************
  KIBO_SHARED_SECRET: *************
  KIBO_API_BASE_URL: https://home.mozu.com
  KIBO_TENANT: ******
  KIBO_SITE_ID: ****
  KIBO_MASTER_CATALOG_ID: 1
  KIBO_CATALOG_ID: 1
```

### Initialize a data directory

If you don't already have a data directory, initialize one with default data:

```bash
kibo-sandbox-data initDataDir
```

This copies a default data directory structure to `./data` (or the path specified with `--data`).

## Commands

### export

Export data from a Kibo environment to local files.

```bash
kibo-sandbox-data export --all
kibo-sandbox-data export --products --locations
kibo-sandbox-data export --categories --documents banners hero_images
```

### import

Import data from local files to a Kibo environment.

```bash
kibo-sandbox-data import --all
kibo-sandbox-data import --categories
kibo-sandbox-data import --products --locations
```

### sync

Sync data from the export environment to the import environment. This runs an export followed by an import.

```bash
kibo-sandbox-data sync --all
kibo-sandbox-data sync --products --categories
```

### clean

Delete data from the target environment (uses the `clear` profile in `.env.yaml`).

```bash
kibo-sandbox-data clean --all
kibo-sandbox-data clean --products --categories
```

### initDataDir

Copy the default data directory to the specified location.

```bash
kibo-sandbox-data initDataDir
kibo-sandbox-data initDataDir --data ./my-data
```

### initEnv

Create an empty `.env.yaml` configuration file.

```bash
kibo-sandbox-data initEnv
```

## Options Reference

### Global Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--help` | | boolean | | Show help |
| `--version` | | boolean | | Show version number |
| `--all` | `-a` | boolean | | Include all resources |
| `--data` | | string | `./data` | Location of data directory |

### Catalog Resources

| Option | Type | Description |
|--------|------|-------------|
| `--categories` | boolean | Include categories |
| `--products` | boolean | Include products |
| `--productAttributes` | boolean | Include product attributes |
| `--productTypes` | boolean | Include product types |
| `--catalogSet` | boolean | Include catalog CSVs (uses Kibo's catalog import/export API) |

### Location Resources

| Option | Type | Description |
|--------|------|-------------|
| `--locations` | boolean | Include locations |
| `--locationGroups` | boolean | Include location groups |
| `--locationGroupConfigurations` | boolean | Include location group configurations |

### Inventory Resources

| Option | Type | Description |
|--------|------|-------------|
| `--inventory` | boolean | Include inventory |

### Document Resources

| Option | Type | Description |
|--------|------|-------------|
| `--documents` | array | Include documents from specified lists (e.g., `--documents banners hero_images`) |
| `--documentLists` | boolean | Include document lists |
| `--documentTypes` | boolean | Include document types |

### Commerce Resources

| Option | Type | Description |
|--------|------|-------------|
| `--discounts` | boolean | Include discounts |
| `--channels` | boolean | Include channels |
| `--orderRouting` | boolean | Include order routing configuration |

### Settings

| Option | Type | Description |
|--------|------|-------------|
| `--generalSettings` | boolean | Include general settings |
| `--fulfillmentSettings` | boolean | Include fulfillment settings |
| `--search` | boolean | Include search configuration |

### Attribute Types

| Option | Type | Description |
|--------|------|-------------|
| `--b2bAttributes` | boolean | Include B2B account attributes |
| `--customerAttributes` | boolean | Include customer attributes |
| `--locationAttributes` | boolean | Include location attributes |
| `--categoryAttributes` | boolean | Include category attributes |
| `--orderAttributes` | boolean | Include order attributes |

## Examples

### Export everything from a tenant

```bash
kibo-sandbox-data export --all
```

### Import only product catalog data

```bash
kibo-sandbox-data import --productAttributes --productTypes --categories --products
```

### Sync locations and inventory between environments

```bash
kibo-sandbox-data sync --locations --locationGroups --inventory
```

### Export specific document lists

```bash
kibo-sandbox-data export --documentTypes --documentLists --documents banners hero_images promo_tiles
```

### Import settings and configuration

```bash
kibo-sandbox-data import --generalSettings --fulfillmentSettings --orderRouting --channels
```

### Use a custom data directory

```bash
kibo-sandbox-data export --all --data ./my-tenant-data
kibo-sandbox-data import --all --data ./my-tenant-data
```

### Clean up products and categories from an environment

```bash
kibo-sandbox-data clean --products --categories
```

## What Gets Included with --all

When using `--all`, the following resources are processed:

**Export:**
- Catalog (via API export)
- Channels
- General settings
- Fulfillment settings
- Discounts
- Locations
- Location groups
- Location group configurations
- Carrier configurations
- B2B attributes
- Customer attributes
- Location attributes
- Category attributes
- Order attributes
- Inventory
- Order routing
- Document types
- Document lists
- Documents
- Search configuration

**Import:**
- Channels
- Catalog (via API import)
- Locations
- Location groups
- Location group configurations
- General settings
- Fulfillment settings
- Carrier configurations
- B2B attributes
- Customer attributes
- Location attributes
- Category attributes
- Order attributes
- Inventory
- Order routing
- Discounts
- Document types
- Document lists
- Documents

**Clean:**
- Products
- Categories
- Product attributes
- Product types
- Locations
- Discounts
- Documents
- Document lists
- Document types

## Data Directory Structure

The data directory contains JSONL (JSON Lines) files for each resource type:

```
data/
  categories.jsonl
  products.jsonl
  product-attributes.jsonl
  product-types.jsonl
  locations.jsonl
  location-groups.jsonl
  location-group-configurations.jsonl
  inventory.jsonl
  discounts.jsonl
  documents.jsonl
  document-lists.jsonl
  document-types.jsonl
  channels.jsonl
  general-settings.jsonl
  fulfillment-settings.jsonl
  carrier-configurations.jsonl
  order-routing.jsonl
  b2b-attributes.jsonl
  customer-attributes.jsonl
  location-attributes.jsonl
  category-attributes.jsonl
  order-attributes.jsonl
  catalog-export/        # Directory for catalog API export files
```

## Development

```bash
git clone https://github.com/KiboSoftware/kibo-sandbox-data-cli
cd kibo-sandbox-data-cli
npm install

# Build and run
npm run build && node bin/index.js export --search
```