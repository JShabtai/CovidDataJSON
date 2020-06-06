# Overview

This repo is a tool to process the Johns Hopkins daily reports into a single JSON file. The file is moderately
large (~8MB at the moment, but obviously growing every day).

# Motivation

The Johns Hopkins data, while really useful, is in a CSV format which can be a bit tricky to parse
into a useful structure. In addition, the timeseries files don't contain recovered or active
case data for subregions (i.e. states/provinces). So this tool parses the _daily reports_ instead
to be able to provide that useful information.

# JSON Structure

If you're using this data, you probably want to know the structure of the data. Here is the Typescript interface that's used:

```
export interface Datapoint {
    confirmed: number;
    recovered: number;
    deaths: number;
    active?: number;
}

type TimeSeriesData = Record<string, Datapoint>;

export interface DatasetInterface {
    name: string;
    data: TimeSeriesData;
    subsets: Record<string, DatasetInterface>;
}
```

As you can see, the structure is recursive. A dataset can contain any number of subsets which are
themselves datasets. The top level is always the 'Global' dataset. This is not directly in the
Johns Hopkins data, but is computed by adding up the number of each case types for each country.

The nesting levels are as follows (further detail, such as cities, may be added in the future):

```
Global
- Country
  - Province/state/territory
  - ...
- Country
  - Province/state/territory
  - Province/state/territory
- ...
```

Example:
```json
{
  "name": "Global",
  "data": {
    "2020-03-22": {
      "confirmed": 137,
      "recovered": 0,
      "deaths": 3,
      "active": 134
    }
  },
  "subsets": {
    "FooCountry": {
      "name": "FooCountry",
      "data": {
        "2020-03-22": {
          "confirmed": 137,
          "recovered": 0,
          "deaths": 3,
          "active": 134
        }
      },
      "subsets": {
        "Province 1": {
          "name": "Province 1",
          "data": {
            "2020-03-22": {
              "confirmed": 8,
              "recovered": 0,
              "deaths": 0,
              "active": 8
            }
          },
          "subsets": {}
        },
        "Province 2": {
          "name": "Province 2",
          "data": {
            "2020-03-22": {
              "confirmed": 6,
              "recovered": 0,
              "deaths": 2,
              "active": 4
            }
          },
          "subsets": {}
        }
      }
    }
  }
}
```

Notes:

* If the CSVs contain rows for the country as a whole, that data is used directly. If data is only
  available for regions within the country, they are added up to compute the country values.
* The active case numbers are not read from the CSVs. They are computed as
  `confirmed - recovered - deaths`.

 # Related works

 The data here is used by my covid graphing tool which you can see at
 [covid.shabtai.ca](https://covid.shabtai.ca). The source is available on [GitHub](https://github.com/JShabtai/covid-data)
