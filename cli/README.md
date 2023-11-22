AKTEMP CLI
==========

To set up the CLI locally, run:

```sh
npm link
aktemp help # see available commands
```

To get debug output set the `DEBUG` environment variable:

```sh
export DEBUG=aktemp*
```

The following code shows some examples of how to use the CLI to load providers, stations, and files from a local filesystem.

```sh
aktemp providers import ../demo/providers.csv
aktemp providers list
aktemp stations import TEST ../demo/stations.csv
aktemp stations list
aktemp files import -d ../demo/files TEST ../demo/filelist.csv
aktemp files list
aktemp files process 1 # change to the file IDs returned by the previous command
aktemp files process 2
aktemp files process 3
```
